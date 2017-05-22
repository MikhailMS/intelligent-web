/**
 * Feed.js
 * 
 * Represents the Feed section/page of the
 * SPA. It provides an interface for the user
 * to search and stream data from Twitter. Also,
 * it provides facilities for trends tracking via
 * the tweet frequency chart component.
 * 
 * @author Petar Barzev
 * 
 * Last updated: 22/05/2017
 */

import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import { Row, Col, Input, Tabs, Switch, message, Pagination, Tooltip } from 'antd';
import Spinner from 'react-spinkit';
import io from 'socket.io-client';
import TwitterCard from './TwitterCard';
import PlayerCard from './PlayerCard';
import TweetChart from './TweetChart';
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
            playerData: null,
            playerName: null,
            loading: false,
        };
    }

    /**
     * React lifecycle method. 
     * Fires before the mounting (first launch) of the component.
     * Opens a socket object for the app entity to use.
     */
    componentWillMount() {
        socket = io('/');
    }

    /**
     * React lifecycle method.
     * Fires before the component is unmounted.
     * Closes the socket object used by this app entity.
     */
    componentWillUnmount() {
        socket.close();
    }

    /**
    * Triggers when the user submits a new FEED query via the search bar.
    */
    onSearchFeed = (feedQuery) => {
        const { selectedTab } = this.state;
        const isStreaming = selectedTab === '2';
        this.setState({
            feedQuery,
            allSearchCards: [],
            searchCards: [],
            cardsReady: false,
            playerName: null,
            playerData: null,
            frequency: null,
            loading: isStreaming !== true,
        }, () => {
            if (selectedTab === '2') this.onStreamSwitch(true);
            else this.doSearchQuery(); // wait for setState to finish and execute
        });
    }


    /**
    * Fires on user stream. Emits the query to the server.
    * Handles the Twitter stream response by setting internal app state.
    */
    onStreamSwitch = (checked) => {
        const { feedQuery } = this.state;
        this.setState({ streamChecked: checked }); // switch stream
        if (checked) {
            socket.emit('open-stream', feedQuery);
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
        this.setState({ streaming: true }); // switch steaming

        // create player listeners if they aren't open
        this.playerListeners();

        // create listener for stream results
        if (!(socket.hasListeners('stream-result'))) {
            socket.on('stream-result', (err, res) => {
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
        const switchPoint = endPoint - pageSize;
        this.setState({
            searchCards: allSearchCards.slice(switchPoint, endPoint),
            currentPage: page
        });
    }

    /**
    * Displays an error message to the user at the top of the screen.
    * Fades away in 2 seconds.
    */
    handleError = (err) => {
        if (err) message.error(`${err.title}: ${err.msg}`);
    }

    /**
     * Creates a loading spinner
     */
    createSpinner = () =>
        <div className='spinnerWrapper'>
            <Spinner spinnerName="folding-cube" className="loadingSpinner" />
        </div>

    /**
     * Creates playername and card result listeners if they do not exist.
     * Listeners wait for player data coming from the server and update state when it arrives
     */
    playerListeners = () => {
        // socket listener that updates on player found events
        if (!(socket.hasListeners('player-found'))) {
            socket.on('player-found', (err, playerName) => {
                this.handleError(err);
                this.setState({ playerName });
            });
        }

        if (!(socket.hasListeners('player-card-result'))) {
            socket.on('player-card-result', (err, playerData) => {
                this.handleError(err);
                if (err) this.setState({ playerName: false });
                this.setState({ playerData });
            });
        }
    }

    /**
    * Handles a change of search. This includes either Twitter or DB search.
    */
    doSearchQuery = () => { //eslint-disable-line
        const { feedQuery, streamChecked } = this.state;

        // close stream if such is open
        if (streamChecked) {
            socket.emit('close-stream', '');
            this.setState({ streamChecked: false });  // stop streaming
        }

        // emit a feed search query
        socket.emit('static-search', { query: feedQuery, db_only: false });

        // handle player listeners
        this.playerListeners();

        // declare a socket listener that updates on feed events
        // check if created so only 1 listener is created
        if (!(socket.hasListeners('feed-search-result'))) {
            socket.on('feed-search-result', (err, res) => {
                this.handleError(err);
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
        }
    }

    /**
     * A method that prepares the Search tab render.
     * Returns the JSX stream components to render.
     */
    renderSearch = () => {
        const { cardsReady, searchCards, dataSize,
            allSearchCards, playerName, playerData, currentPage, loading } = this.state;

        let twitterCards;

        // create a player card
        const playerCard = (
            <PlayerCard title={playerName} playerData={playerData} />
        );

        if (cardsReady) {
            twitterCards = (
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
        } else twitterCards = null;

        const spinner = loading ? this.createSpinner() : null;

        // render scene if data is loaded
        return (
            <div>
                {playerCard}
                {spinner}
                {twitterCards}
            </div>
        );
    }

    /**
     * A method that prepares the Stream tab render.
     * Returns the JSX stream components to render.
     */
    renderStream = () => {
        const { streamResults, streamChecked } = this.state;

        // a stream switch. JSX element
        const toggle = (
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
                {toggle}
                {stream}
            </div>
        );
    }

    /**
     * Creates the necessary data displayed in the Statistics tab
     * Returns the JSX components to be rendered.
     */
    renderStats = () => {
        const { frequency, loading } = this.state;
        const spinner = loading ? this.createSpinner() : null;

        return (
            <div>
                {spinner}
                <TweetChart frequency={frequency} />
            </div>
        );
    }

    /**
     * Main React render method.
     * Called every time the state updates.
     */
    render() {
        const searchHint = 'Search by players, teams and author. Example query: "#hazard OR #chelsea BY @WayneRooney"';
        return (
            <div>
                <Row className="row" type="flex" justify="center">
                    <Col span={18}>
                        <Tooltip placement="bottomRight" title={searchHint}>
                            <Search
                                className="searchBar"
                                placeholder="Enter feed query ..."
                                onSearch={(value) => this.onSearchFeed(value)}
                            />
                        </Tooltip>
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
                            <TabPane tab="Statistics" key="3">{this.renderStats()}</TabPane>
                        </Tabs>
                    </Col>
                </Row>
            </div >
        );
    }
}

export default Feed;
