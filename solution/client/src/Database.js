/**
 * Database.js
 * 
 * Represents the Database section/page
 * of the SPA. It provides an interface for the
 * user to search the database.
 * 
 * @author Petar Barzev
 * 
 * Last updated: 22/05/2017
 */

import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import { Row, Col, Input, Icon, Pagination, message, Tooltip } from 'antd';
import io from 'socket.io-client';
import TwitterCard from './TwitterCard';
import PlayerCard from './PlayerCard';
import './App.css';

// setup config variables
const Search = Input.Search;
let socket; // declare a global Database socket variable

class Database extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dbResults: {},
            dbReceived: false,
            dbCards: [],
            currentPage: 1,
            playerData: null,
            playerName: null,
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
    * Triggered when the user submits a new DB query via the search bar.
    */
    onSearchDB = (dbQuery) => {
        this.setState({
            dbResults: {},
            dbReceived: false,
            dbCards: [],
            currentPage: 1,
            playerData: null,
            playerName: null,
        });

        // emit a db search query
        socket.emit('static-search', { query: dbQuery, db_only: true });

        // socket listener that updates on DB search events
        // check if created so only 1 listener is created
        if (!(socket.hasListeners('db-search-result'))) {
            socket.on('db-search-result', (err, res) => {
                const dbReceived = res.tweets.length > 0;
                let dbError;
                if (!dbReceived) dbError = true;
                this.handleError(err, dbError);
                this.setState({ dbResults: res.tweets, dbReceived });
            });
        }

        // socket listener that updates on player found events
        if (!(socket.hasListeners('player-found'))) {
            socket.on('player-found', (err, playerName) => {
                this.handleError(err);
                this.setState({ playerName });
            });
        }

        // socket listener that updates on player found events
        if (!(socket.hasListeners('player-card-result'))) {
            socket.on('player-card-result', (err, playerData) => {
                this.handleError(err);
                if (err) this.setState({ playerName: false });
                this.setState({ playerData });
            });
        }
    }

    /**
     * Displays an error message to the user at the top of the screen.
     * Fades away in 2 seconds
     */
    handleError = (err, dbErr) => {
        if (err) message.error(`${err.title}: ${err.msg}`);
        else if (dbErr) {
            message.error(
                'No results found in the database!'
            );
        }
    }

    /**
    * Pagination distributor. Returns the calculated cards to display
    */
    changeCards = (page, pageSize, twitCards) => {
        const endPoint = page * pageSize;
        const startPoint = endPoint - pageSize;
        this.setState({
            dbCards: twitCards.slice(startPoint, endPoint),
            currentPage: page
        });
    }

    /**
    * Renders the Database results
    */
    renderDB = () => {
        const { dbResults, dbReceived, dbCards, currentPage, playerName, playerData } = this.state;

        // create a player card
        const playerCard = <PlayerCard title={playerName} playerData={playerData} />;

        const dbData = () => {
            if (dbReceived) {
                const twitCards = dbResults.map((el) => <TwitterCard key={el.id} tweet={el} />);
                const dataSize = twitCards.length;
                let displayedCards; // holds the cards to be displayed

                // check if searchCards state contains cards to display
                if (dbCards.length > 0) {
                    displayedCards = dbCards;
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
            } return null;
        };

        return (
            <div>
                {playerCard}
                {dbData()}
            </div>
        );
    }

    // main render method
    render() {
        const searchHint = 'Search by players, teams and author. Example query: "#hazard OR #chelsea BY @WayneRooney"';
        return (
            <div>
                <Row className="row" type="flex" justify="center">
                    <Col span={17}>
                        <Search
                            className="searchBar"
                            placeholder="Enter feed query ..."
                            onSearch={(value) => this.onSearchDB(value)}
                        />
                    </Col>
                    <Col span={1}>
                        <div className="hint">
                            <Tooltip placement="bottomRight" title={searchHint}>
                                <Icon className="questionIcon" type="question-circle-o" />
                            </Tooltip>
                        </div>
                    </Col>
                </Row>
                <Row className="row" type="flex" justify="center">
                    <Col span={18}>
                        {this.renderDB()}
                    </Col>
                </Row>
            </div>
        );
    }
}

export default Database;
