import React, { Component } from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import { Row, Col, Input, Pagination, Tooltip } from 'antd';
import io from 'socket.io-client';
import TwitterCard from './TwitterCard';
import './App.css';

// setup config variables
const Search = Input.Search;
let socket; // declare a global Database socket variable

class Database extends Component {
    constructor(props) {
        super(props);
        this.state = {
            dbResults: {},
            dbCards: [],
            currentPage: 1,
        };
    }

    componentWillMount() {
        socket = io('/');
    }

    componentWillUnmount() {
        socket.close();
    }

    /**
    * Triggered when the user submits a new DB query via the search bar.
    */
    onSearchDB = (dbQuery) => {
        // emit a db search query
        socket.emit('search-query', { query: dbQuery, db_only: true });

        // declare a socket listener that updates on DB events
        // check if created so only 1 listener is created
        if (!(socket.hasListeners('db-search-result'))) {
            socket.on('db-search-result', (res) => {
                this.setState({ dbResults: res });
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
            dbCards: twitCards.slice(startPoint, endPoint),
            currentPage: page
        });
    }

    /**
    * Renders the Database results
    */
    renderDB = () => {
        const { dbResults, dbCards, currentPage } = this.state;

        if (!(Object.keys(dbResults).length === 0 && dbResults.constructor === Object)) {
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
        }
    }

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
                                onSearch={(value) => this.onSearchDB(value)}
                            />
                        </Tooltip>
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
