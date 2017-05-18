import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import { Row, Col, Input, Tabs, Switch, Pagination } from 'antd';
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
            searchResults: {},
            streamResults: [],
            frequency: {},
            searchCards: [],
            currentPage: 1,
            selectedTab: '1'
        };
    }

    componentWillMount() {
        socket = io('/');
    }

    componentWillUnmount() {
        socket.close();
    }

    /**
    * Triggered when the user submits a new FEED query via the search bar.
    */
    onSearchFeed = (feedQuery) => this.setState({ feedQuery }, () => {
        const { selectedTab } = this.state;
        if (selectedTab === '2') this.onStreamSwitch(true);
        else this.handleFeedQuery(); // wait for setState to finish and execute
    });

    /**
    * Handles a change of search. This includes either Twitter or DB search.
    */
    handleFeedQuery = () => { //eslint-disable-line
        const { feedQuery, streamChecked } = this.state;

        // close stream if such is open
        if (streamChecked) {
            socket.emit('close-stream', '');
            this.setState({ streamChecked: false });  // start streaming
        }

        // emit a feed search query
        socket.emit('search-query', { query: feedQuery, db_only: false });

        this.setState({feedReceived: false, searchResults: []});

        // declare a socket listener that updates on feed events
        // check if created so only 1 listener is created
        if (!(socket.hasListeners('feed-search-result'))) {
            socket.on('feed-search-result', (res) => {
                this.setState({
                    feedReceived: true,
                    searchResults: res.tweets,
                    frequency: res.frequency
                });
            });
        }
    };

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
    changeCards = (page, pageSize, twitCards) => {
        const endPoint = page * pageSize;
        const startPoint = endPoint - pageSize;
        this.setState({
            searchCards: twitCards.slice(startPoint, endPoint),
            currentPage: page
        });
    }

    /**
    * Generates the Twitter feed 
    */
    renderSearch = () => {
        const { searchResults, searchCards, currentPage } = this.state;

        if (!(Object.keys(searchResults).length === 0 && searchResults.constructor === Object)) {
            const twitCards = searchResults.map((el) => <TwitterCard key={el.id} tweet={el} />);
            const dataSize = twitCards.length;
            let displayedCards; // holds the cards to be displayed

            // check if searchCards state contains cards to display
            if (searchCards.length > 0) {
                displayedCards = searchCards;
            } else displayedCards = twitCards.slice(0, 10); // take first 10 cards

            // the JSX to render
            return (
                <div className="feed">
                    <Row className="row" type="flex" justify="center">
                        <Pagination
                            onChange={(page, pageSize) =>
                                this.changeCards(page, pageSize, twitCards)}
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
                            {displayedCards}
                        </CSSTransitionGroup>
                        <Row className="row" type="flex" justify="center">
                            <Pagination
                                onChange={(page, pageSize) =>
                                    this.changeCards(page, pageSize, twitCards)}
                                current={currentPage} pageSize={10} total={dataSize}
                            />
                        </Row>
                    </Row>
                </div>
            );
        }
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
                            <TabPane tab="Search" key="1">{this.renderSearch()}</TabPane>
                            <TabPane tab="Stream" key="2">{this.renderStream()}</TabPane>
                            <TabPane tab="Statistics" key="3">Statistics</TabPane>
                        </Tabs>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Feed;
