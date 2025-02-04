const cheerio = require('cheerio');
const axios = require('axios');
const fs = require("fs").promises;
import { assert } from 'console';
import { isRCPCTokenRequired,getCookie } from '../utils/scraper';

import {ProblemClass} from "./problem";

export class ContestClass{
    problems: ProblemClass[] = [];
    name: string;
    contestID: number;
    contestLink: string;
    type: string;
    startTime: string;
    startDate: string;
    duration: string;

    constructor(contestID: number, type: string, name:string, startTime: string, startDate: string, duration: string){
        this.problems = [];
        this.name = name;
        this.type = type; // PAST, RUNNING OR FUTURE
        this.contestID = contestID;
        this.contestLink = `https://codeforces.com/contest/${this.contestID}`;
        this.startTime = startTime;
        this.startDate = startDate;
        this.duration = duration;
    }

    async init(){
        let rcpcValue = "";
        try{
            const response = await axios.get("https://codeforces.com");
            let [_,a,b,c] = isRCPCTokenRequired(response);
            rcpcValue = getCookie(a,b,c);
            console.log(rcpcValue);
            // somehow get rcpc_value
        } catch(err) {
            console.log(err);
        }
        try{
            assert(this.type !== "FUTURE");
            // const rcpcValue = "6164ef00544d3b5266657b2349cea803";
            const { data } = await axios.get(this.contestLink,{
                headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    Cookie: `RCPC=${rcpcValue}; expires=Thu, 31-Dec-37 23:55:55 GMT; path=/`,
                }
            });
                                    
            const $ = cheerio.load(data);

            // const contestName = $('.rtable > tbody:nth-child(1) > tr:nth-child(1) > th:nth-child(1) > a:nth-child(1)');
            // this.name = contestName.text();

            let problemIndices = $('table.problems > tbody > tr > td.id > a');
            let problemNames = $('tr > td > div > div > a');

            assert(problemIndices.length === problemNames.length);
            for(let i = 0; i < problemNames.length; i++){
                let index = $(problemIndices[i]).text().trim();
                let name = $(problemNames[i]).text().trim();

                let p = new ProblemClass(this.contestID, index, name);
                this.problems.push(p);
            }
        }
        catch{
            console.log('Could not find contest. Either the codeforces servers are down or internet connection is not stable');
        }
    }
};