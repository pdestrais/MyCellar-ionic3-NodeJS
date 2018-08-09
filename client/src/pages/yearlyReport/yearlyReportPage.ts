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
  selector: 'yearlyReport',
  templateUrl: 'yearlyReportPage.html'
})
export class yearlyReportPage {

  private vins:Array<VinModel>;
  private vinsFiltered:Array<VinModel>;
  private readyToDrinkList:Array<VinModel>;
  private typesGrouping:Array<any> =[];
  private typesYearGrouping:Array<any> =[];
  private typesYearOrigineGrouping:Array<any> =[];
  private breadcrumb:Array<any>=[];
  
  constructor(public navCtrl: NavController,public navParams: NavParams, public pouch:PouchdbService, private logger:LoggerService) {
    this.logger.log("[yearlyReportPage - constructor]called");
  }
  
  public ionViewWillEnter() {
    this.logger.log("[yearlyReportPage - ionViewWillEnter]called");
    let ddStruct = this.navParams.get("ddStruct");
    this.pouch.getDocsOfType('vin').then(vins => {
      this.vins = vins.sort((a,b) => { return ((a.annee+a.pays+a.region+a.nom)<(b.annee+b.pays+b.region+b.nom)?-1:1); } );

      // Showing list of wines selected by type/year/origin
      if (ddStruct && ddStruct.type && ddStruct.origine && ddStruct.year) {
        //let viewStack:any = this.navCtrl._views;
        this.breadcrumb[0] =  {selected:ddStruct.type,back:3};
        this.breadcrumb[1] =  {selected:ddStruct.year,back:2};
        this.breadcrumb[2] =  {selected:ddStruct.origine,back:1};
        this.vinsFiltered = this.vins.filter(v => {
          return (v.nbreBouteillesReste != 0 && 
              v.type.nom == ddStruct.type.key && 
              v.annee == ddStruct.year.key && 
              v.origine.pays+' - '+v.origine.region == ddStruct.origine.key); 
        });  
        this.logger.debug("[yearlyReportPage - ionViewWillEnter]# vins loaded with type/annee/region: "+this.vinsFiltered.length+" - "+ddStruct.type.key+"/"+ddStruct.year.key+"/"+ddStruct.origine.key);
      } 
      else /* Showing number of wines per origin for wines selected by type/year */if (ddStruct && ddStruct.type && ddStruct.year) {
        this.breadcrumb[0] =  {text:ddStruct.type.key,number:ddStruct.type.value,selected:ddStruct.type,back:2};
        this.breadcrumb[1] =  {text:ddStruct.year.key,number:ddStruct.year.value,selected:ddStruct.year,back:1};
        this.logger.debug("[yearlyReportPage - ionViewWillEnter]# vins loaded with type/year: "+this.vins.length+" - "+ddStruct.type.key+"/"+ddStruct.year.key);
        this.typesYearOrigineGrouping = d3.nest()
          .key(function(d:any) { return d.origine.pays+' - '+d.origine.region; })
          .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
          .entries(this.vins.filter(function(d) { return (d.nbreBouteillesReste !=0 && 
                                                          d.type.nom == ddStruct.type.key && 
                                                          d.annee == ddStruct.year.key) 
                                                }));
        this.logger.log("[yearlyReportPage - ionViewWillEnter]typesOrigineYearGrouping : "+JSON.stringify(this.typesYearGrouping));
        this.typesYearOrigineGrouping.sort((a,b) => { return (a.key<b.key?-1:1); });
        this.logger.log("[yearlyReportPage - ionViewWillEnter]typesOrigineYearGrouping : "+JSON.stringify(this.typesYearGrouping));
      } 
      else /* Showing number of wines per origin for wines selected by type */if (ddStruct && ddStruct.type) {
        this.breadcrumb[0] =  {text:ddStruct.type.key,number:ddStruct.type.value,selected:ddStruct.type,back:1};
        this.logger.debug("[yearlyReportPage - ionViewWillEnter]# vins loaded with type: "+this.vins.length+" - "+ddStruct.type.key);
        this.typesYearGrouping = d3.nest()
          .key(function(d:any) { return d.annee; })
          .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
          .entries(this.vins.filter(function(d) { return (+d.nbreBouteillesReste !=0 && 
                                                          d.type.nom == ddStruct.type.key) 
                                                }));
        this.typesYearGrouping.sort((a,b) => { return (a.key<b.key?-1:1); });  
        this.logger.log("[yearlyReportPage - ionViewWillEnter]typesGrouping : "+JSON.stringify(this.typesYearGrouping));
      } else /* Showing number of wines per type */if (!ddStruct) {
          this.logger.debug("[yearlyReportPage - ionViewWillEnter]# vins loaded : "+this.vins.length);
            this.typesGrouping = d3.nest()
            .key(function(d:any) { return d.type.nom; })
            .rollup(function(v) { return d3.sum(v, function(d:any) { return d.nbreBouteillesReste; }); })
            .entries(this.vins.filter(function(d:any) { return (d.nbreBouteillesReste != 0 || d.nbreBouteillesReste != "0") }));
            this.logger.log("[yearlyReportPage - ionViewWillEnter]typesGrouping after sort : "+JSON.stringify(this.typesGrouping));
      } 
    });        
  }

  selectType(type:any) {
    this.navCtrl.push(yearlyReportPage,{ddStruct:{type:type}});
  }

  selectOrigine(type:any,year:any,origine:any) {
    this.navCtrl.push(yearlyReportPage,{ddStruct:{type:type,year:year,origine:origine}});
  }

  selectYear(type:any,year:any) {
    this.navCtrl.push(yearlyReportPage,{ddStruct:{type:type,year:year}});
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

  showReadyToDrink() {
    let now = moment();
    this.readyToDrinkList=[];
    this.vins.forEach(v => {
      if (v.apogee) {
        let drinkFromTo = v.apogee.split("-");
        if (parseInt(drinkFromTo[0]) <= now.year() && parseInt(drinkFromTo[1]) >= now.year())
          this.readyToDrinkList.push(v);
      } 
    });       
    this.navCtrl.push(yearlyReportPage,{readyToDrinkList:this.readyToDrinkList});
  }

}
