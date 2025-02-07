import React, { Component } from 'react';
import Card from './Card';
import CardModal from './CardModal';
import $ from 'jquery'


export default class CardBoard extends Component {

    constructor(props) {
        super(props);

        this.state = {
            applications: [], 
            card_titles: [],
            card_class: [],
            showModal:false
        }
        this.getData = this.getData.bind(this);
        this.groupApplication = this.groupApplication.bind(this);
        this.createCardTitle = this.createCardTitle.bind(this);
        this.createCardClass = this.createCardClass.bind(this);
    }

    // get initial data to render the root page
    getData(){
        return $.ajax({
                url: 'http://localhost:5000/application',
                method: 'GET'
        })
    }

    componentDidMount(){
        // fetch the data only after this component is mounted
        this.getData()
        .done((data) => {
            data = JSON.parse(data);
            // console.log(data);
            let result = this.groupApplication(data);
            let card_titles = this.createCardTitle(result);
            let card_class = this.createCardClass(result);
            this.setState({
                applications: data, 
                card_titles: card_titles,
                card_class: card_class
            })
        });
    }

    // the update function for child component
    updateCardBoard(application){
        let newApplications = this.state.applications
        // console.log(application)
        if (application.id == null){
            // current application is a new application, create a new one and save in the backend.
            console.log('new application');
            $.ajax({
                url: 'http://localhost:5000/application', //TODO: will have to replace with production URL
                method: 'POST',
                async: false,
                data:JSON.stringify({
                    application: application
                }),
                contentType: 'application/json',
                success: (msg)=>{
                    console.log(msg)
                },
                complete: function(data) {
                    newApplications.push(data.responseJSON)
                }
            })
        } else {
            console.log('updating id=' + application.id)
            $.ajax({
                url: 'http://localhost:5000/application',
                method: 'PUT',
                async: false,
                data:JSON.stringify({
                    application: application
                }),
                contentType: 'application/json',
                success: (msg)=>{
                    console.log(msg)
                },
                complete: function(data) {
                    let updatedApp = data.responseJSON
                    let idx = newApplications.findIndex((a => a.id === updatedApp.id))
                    newApplications[idx] = updatedApp
                }
            })
        }
        // rerender the page to represent the update result
        let result = this.groupApplication(newApplications);
        let card_titles = this.createCardTitle(result);
        let card_class = this.createCardClass(result);

        this.setState({
            applications: newApplications,
            card_titles: card_titles,
            card_class: card_class,
            showModal: false,
            application: null
        })
    }

    deleteApplication(application) {
        let newApplications = this.state.applications
        console.log('deleting id=' + application.id)
        $.ajax({
            url: 'http://localhost:5000/application',
            method: 'DELETE',
            async: false,
            data:JSON.stringify({
                application: application
            }),
            contentType: 'application/json',
            success: (msg)=>{
                    console.log(msg)
            },
            complete: function(data) {
                let idx = newApplications.indexOf(data.responseJSON)
                newApplications.splice(idx, 1)
            }
        })
        // rerender the page to represent the update result
        let result = this.groupApplication(newApplications);
        let card_titles = this.createCardTitle(result);
        let card_class = this.createCardClass(result);

        this.setState({
            applications: newApplications,
            card_titles: card_titles,
            card_class: card_class,
            showModal: false,
            application: null
        })
    }

    // open the card modal according to the application in parameter
    showEditModal(application, mode) {
        let modalMode = mode
            
        this.setState({
            showModal: true,
            application: application,
            modalMode: modalMode
        })
    }

    closeEditModal() {
        this.setState({
            showModal: false,
            application: null
        })
    }

    // create all cards(application) and make cards having the same class in the same column
    createCardClass(applications_group) {
        return applications_group.reduce((pv, v) => {
            let app_class = <div className="col" key={v.title + "_class"} id={v.title + "_class"}>
                {v.applications.reduce((pv, v) => {
                    let card = <Card application={v} key={v.id} showEditModal={this.showEditModal.bind(this, v, 'update')} />
                    pv.push(card)
                    return pv
                }, [])}
                {/* add function not implement */}
                <div className="card card-col">
                    <div className="card-body new-col" onClick={this.showEditModal.bind(this, {class: v.class}, 'create')}>
                        <i className="fas fa-plus text-center"></i>
                    </div>
                </div>
            </div>
            pv.push(app_class)
            return pv
        }, [])
    }

    // create the class title
    createCardTitle(applications_group) {
        return applications_group.reduce((pv, v) => {
            let title = <div className="col" key={v.title + "_title"}>
                <div className="card card-col">
                    <div className="card-body noPadding">
                        <div type="text" className="text-center title-col form-control-lg" >
                            {v.title}
                        </div>
                    </div>
                </div>
            </div>
            pv.push(title);
            return pv;
        }, [])
    }

    // initialize the data, classify data according to their class
    groupApplication(applications) {
        let result = [
            {
                title: 'Wish list',
                applications: [],
                class: "1"
            }, {
                title: 'Waiting for referral',
                applications: [],
                class: "2"
            }, {
                title: 'Applied',
                applications: [],
                class: "3"
            }, {
                title: 'Rejected',
                applications: [],
                class: "4"
            }
        ]
        applications?.forEach(app => {
            let app_class = result.find(v => { return v.class === app.status });
            app_class?.applications.push(app);
        })
        return result;
    }

    render() {
        let applicationModal = null
        if (this.state.application){
            applicationModal = <CardModal show={this.state.showModal}
                                          submitFunc={this.updateCardBoard.bind(this)}
                                          mode={this.state.modalMode}
                                          application={this.state.application}
                                          closeEditModal={this.closeEditModal.bind(this)}
                                          deleteApplication={this.deleteApplication.bind(this)}/>
        }
        return (
            <span id="tab">
                <div className="row">
                    {this.state.card_titles}
                </div>
                <div className="row">
                    {this.state.card_class}
                </div>
                {applicationModal}
            </span>
        )
    }
}
