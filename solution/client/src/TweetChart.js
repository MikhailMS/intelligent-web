/**
 * TweetChart.js
 * 
 * An interactive chart component that
 * presents the tweet frequency of a  
 * specific query in a specific date range.
 * Used in Statistics tab of Feed component.
 * 
 * @author Petar Barzev
 * 
 * Last updated: 22/05/2017
 */

import React, { Component } from 'react';
import { Row } from 'antd';
import RC2 from 'react-chartjs2';

class TweetChart extends Component {
    render() {
        const { frequency } = this.props;
        if (frequency) {
            // prepare chart data
            // reverse arrays so earlier days and data come first
            const labels = Object.keys(frequency).map(key => key).reverse();
            const data = Object.keys(frequency).map(key => frequency[key]).reverse();
            const chartData = {
                labels,
                datasets: [
                    {
                        label: 'Tweet frequency',
                        fill: false,
                        lineTension: 0.1,
                        backgroundColor: 'rgba(75,192,192,0.4)',
                        borderColor: 'rgba(75,192,192,1)',
                        borderCapStyle: 'butt',
                        borderDash: [],
                        borderDashOffset: 0.0,
                        borderJoinStyle: 'miter',
                        pointBorderColor: '#000',
                        pointBackgroundColor: '#000',
                        pointBorderWidth: 1,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: 'rgba(75,192,192,1)',
                        pointHoverBorderColor: 'rgba(220,220,220,1)',
                        pointHoverBorderWidth: 2,
                        pointRadius: 1,
                        pointHitRadius: 10,
                        data,
                        spanGaps: false,
                    }
                ]
            };
            return (
                <Row className="row" type="flex" justify="center">
                    <RC2 data={chartData} className="freqChart" type='line' />
                </Row>
            );
        } return null; // no data to render
    }
}

export default TweetChart;
