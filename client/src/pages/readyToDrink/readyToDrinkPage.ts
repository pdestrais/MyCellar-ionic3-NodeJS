import { LoggerService } from './../../services/log4ts/logger.service';
import { VinPage } from './../vin/vin';
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { PouchdbService } from './../../services/pouchdb.service';
import { VinModel } from '../../models/cellar.model'
import * as d3 from 'd3';
import moment from 'moment';
//import { d3 } from 'd3';

@Component({
  selector: 'readyToDrink',
  templateUrl: 'readyToDrinkPage.html'
})
export class readyToDrinkPage {

  private vins:Array<VinModel>;
  private vinsFiltered:Array<VinModel>;
  private readyToDrinkList:Array<VinModel>;
  private typesGrouping:Array<any> =[];
  private typesOrigineGrouping:Array<any> =[];
  private typesOrigineYearGrouping:Array<any> =[];
  private breadcrumb:Array<any>=[];
  
  constructor(public navCtrl: NavController,public navParams: NavParams, public pouch:PouchdbService, private logger:LoggerService) {
    this.logger.log("[Rapport - constructor]called");
  }
  
  public ionViewWillEnter() {
    this.logger.log("[readyToDrinkPage - ionViewWillEnter]called");
    let now = moment();
    this.readyToDrinkList=[];
    this.pouch.getDocsOfType('vin').then(vins => {    
      vins.forEach(v => {
        if (v.apogee) {
          let drinkFromTo = v.apogee.split("-");
          if (parseInt(drinkFromTo[0]) <= now.year() && parseInt(drinkFromTo[1]) >= now.year())
            this.readyToDrinkList.push(v);
        } 
      });
    });
  }

  selectWine(wine) {
//    this.navCtrl.setRoot(VinPage,{id:wine._id});    
    this.navCtrl.push(VinPage,{id:wine._id});    
  }
  goBack(index:number) {
    for (let i=1;i<=index;i++) {
      this.navCtrl.pop();
    }
  }

}
