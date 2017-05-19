import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import { Row, Col, Input, Tabs, Switch, Pagination } from 'antd';
import RC2 from 'react-chartjs2';
import Spinner from 'react-spinkit';
import io from 'socket.io-client';
import TwitterCard from './TwitterCard';
import './App.css';

// setup config variables
const Search = Input.Search;
const { TabPane } = Tabs;
let socket; // declare a global Feed socket variable

class Feed extends Component {
    constructor(props) {
        super(props);
        this.state = {
            feedQuery: '',
            streamChecked: false,
            allSearchCards: [],
            streamResults: [],
            frequency: null,
            searchCards: [],
            currentPage: 1,
            selectedTab: '1',
            cardsReady: false,
            dataSize: null,
            loading: false,
        };
    }

    componentWillMount() {
        socket = io('/');
    }

    componentWillUnmount() {
        socket.close();
    }

    /**
    * Triggers when the user submits a new FEED query via the search bar.
    */
    onSearchFeed = (feedQuery) => {
        const { selectedTab } = this.state;
        const isStreaming = selectedTab === '2';
        let loading;
        if (isStreaming) {
            loading = false;
        } else loading = true;
        this.setState({
            feedQuery,
            allSearchCards: [],
            searchCards: [],
            cardsReady: false,
            loading,
        }, () => {
            if (selectedTab === '2') this.onStreamSwitch(true);
            else this.handleFeedQuery(); // wait for setState to finish and execute
        });
    }


    /**
    * Fires on user stream. Emits the query to the server.
    * Handles the Twitter stream response by setting internal app state.
    */
    onStreamSwitch = (checked) => {
        const { feedQuery } = this.state;
        this.setState({ streamChecked: checked }); // start stream
        if (checked) {
            socket.emit('stream-query', feedQuery);
            this.handleStream();
        } else { // close stream
            socket.emit('close-stream', '');
            this.setState({ streaming: false });
        }
    };

    /**
    * Handles the server Twitter search response. Saves user query to app state.
    */
    handleStream = () => {
        this.setState({ streaming: true }); // start steaming

        // create listener for stream results
        if (!(socket.hasListeners('stream-result'))) {
            socket.on('stream-result', (res) => {
                const { streamResults } = this.state;
                let newResults;
                if (streamResults.length === 0) newResults = [res];
                else newResults = [res].concat(streamResults);
                this.setState({ streamResults: newResults });
            });
        }
    }

    /**
    * Pagination distributor. Returns the calculated cards to display
    */
    changeCards = (page, pageSize, allSearchCards) => {
        const endPoint = page * pageSize;
        const startPoint = endPoint - pageSize;
        this.setState({
            searchCards: allSearchCards.slice(startPoint, endPoint),
            currentPage: page
        });
    }

    /**
    * Handles a change of search. This includes either Twitter or DB search.
    */
    handleFeedQuery = () => { //eslint-disable-line
        const { feedQuery, streamChecked } = this.state;

        // close stream if such is open
        if (streamChecked) {
            socket.emit('close-stream', '');
            this.setState({ streamChecked: false });  // stop streaming
        }

        // emit a feed search query
        socket.emit('search-query', { query: feedQuery, db_only: false });

        // declare a socket listener that updates on feed events
        // check if created so only 1 listener is created
        if (!(socket.hasListeners('feed-search-result'))) {
            socket.on('feed-search-result', (res) => {
                console.log('frequency', res.frequency);
                const searchResults = res.tweets;
                const twitCards = searchResults.map(
                    el => <TwitterCard key={el.id} tweet={el} />);
                const newSearchCards = twitCards.slice(0, 10); // take first 10 cards
                this.setState({
                    frequency: res.frequency,
                    allSearchCards: twitCards,
                    currentPage: 1,
                    twitCards,
                    dataSize: twitCards.length,
                    searchCards: newSearchCards,
                    cardsReady: true,
                    loading: false
                });
            });
        };
    }

    /**
    * Generates the Twitter feed 
    */
    renderSearch = () => {
        const { cardsReady, searchCards, dataSize,
            allSearchCards, currentPage, loading } = this.state;

        if (loading) { // render spinner if data is being prepared
            return (
                <div className='spinnerWrapper'>
                    <Spinner spinnerName="folding-cube" className="loadingSpinner" />
                </div>
            );
        } else if (cardsReady) {
            // the JSX to render
            return (
                <div className="feed">
                    <Row className="row" type="flex" justify="center">
                        <Pagination
                            onChange={(page, pageSize) =>
                                this.changeCards(page, pageSize, allSearchCards)}
                            current={currentPage} pageSize={10} total={dataSize}
                        />
                    </Row>
                    <Row>
                        <CSSTransitionGroup
                            transitionName="tweetAnim"
                            transitionAppear={true} //eslint-disable-line
                            transitionEnterTimeout={500}
                            transitionLeaveTimeout={300}
                            transitionAppearTimeout={500}
                        >
                            {searchCards}
                        </CSSTransitionGroup>
                        <Row className="row" type="flex" justify="center">
                            <Pagination
                                onChange={(page, pageSize) =>
                                    this.changeCards(page, pageSize, allSearchCards)}
                                current={currentPage} pageSize={10} total={dataSize}
                            />
                        </Row>
                    </Row>
                </div>
            );
        }
        return null;  // nothing to render
    }

    renderStream = () => {
        const { streamResults, streamChecked } = this.state;

        // a stream start. JSX element
        const start = (
            <Row>
                <Switch
                    checked={streamChecked}
                    className="switch"
                    checkedChildren={'Stream'}
                    unCheckedChildren={'Stream'}
                    onChange={(checked) => this.onStreamSwitch(checked)}
                />
            </Row>
        );

        // tweet results
        let stream = null;

        // create the stream feed if stream results are generated
        if (!(Object.keys(streamResults).length === 0)) {
            const streamCards = streamResults.map(
                (el) => <div key={el.id}><TwitterCard tweet={el} /></div>);

            // Stream JSX to render
            stream = (
                <Row>
                    <CSSTransitionGroup
                        transitionName="tweetAnim"
                        transitionEnterTimeout={500}
                        transitionLeaveTimeout={300}
                        transitionAppearTimeout={500}
                    >
                        {streamCards}
                    </CSSTransitionGroup>
                </Row>
            );
        }

        // return feed
        return (
            <div className="feed">
                {start}
                {stream}
            </div>
        );
    }

    renderStats = () => {
        const { frequency } = this.state;

        if (frequency) {
            // prepare chart data
            // reverse arrays so earlier days and data come first
            const labels = Object.keys(frequency).map(key => key).reverse();
            const data = Object.keys(frequency).map(key => frequency[key]).reverse();
            console.log(frequency);
            console.log(labels);
            console.log(data);
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
                        pointBorderColor: 'rgba(75,192,192,1)',
                        pointBackgroundColor: '#fff',
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
                <RC2 data={chartData} type='line' />
            );
        } return null;
    }

    render() {
        return (
            <div>
                <Row className="row" type="flex" justify="center">
                    <Col span={18}>
                        <Search
                            className="searchBar"
                            placeholder="Enter feed query ..."
                            onSearch={(value) => this.onSearchFeed(value)}
                        />
                    </Col>
                </Row>
                <Row className="row" type="flex" justify="center">
                    <Col span={18}>
                        <Tabs
                            defaultActiveKey="1"
                            onChange={(tab) => this.setState({ selectedTab: tab })}
                        >
                            <TabPane
                                tab="Search"
                                key="1"
                                className="tabPane"
                            >
                                {this.renderSearch()}
                            </TabPane>
                            <TabPane tab="Stream" key="2">{this.renderStream()}</TabPane>
                            <TabPane tab="Statistics" key="3">{this.renderStats()}</TabPane>
                        </Tabs>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Feed;
