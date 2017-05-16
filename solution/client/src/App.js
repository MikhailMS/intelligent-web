import React, { Component } from 'react';
import LazyLoad from 'react-lazy-load';
import { BrowserRouter as Router, Route, Link, Redirect } from 'react-router-dom';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import { Layout, Row, Col, Input, Tag, Tabs, Card, Badge, Switch, Menu, Pagination } from 'antd';
import io from 'socket.io-client';
import Linkify from 'react-linkify';
import 'typeface-roboto';
import './App.css';

// setup useful variables
const { Header, Footer, Content } = Layout;
const Search = Input.Search;
const { TabPane } = Tabs;
const socket = io('/');
const linkifyProperties = {
  target: '_blank'
};
let newResults = [];

/**
 * Main client App component
 */
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabSelected: '1',
      feedReceived: false,
      dbReceived: false,
      streamChecked: false,
      streaming: false,
      feedResults: {},
      dbResults: {},
      feedQuery: ''
    };
  }

  /**
   * Triggered when the user submits a new FEED query via the search bar.
   */
  onSearchFeed = (feedQuery) => {
    this.setState({ feedQuery },
      this.handleFeedQuery); // wait for setState to finish and handle the search
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
        this.setState({ dbReceived: true, dbResults: res });
      });
    }
  }

  /**
  * Handles a change of search. This includes either Twitter or DB search.
  */
  handleFeedQuery = () => { //eslint-disable-line
    const { feedQuery, streamChecked } = this.state;

    // close stream if such is open
    if (streamChecked) {
      socket.emit('close-stream', '');
      this.setState({ streamChecked: false });  // toggle streaming
    }

    // emit a feed search query
    socket.emit('search-query', { query: feedQuery, db_only: false });

    // declare a socket listener that updates on feed events
    // check if created so only 1 listener is created
    if (!(socket.hasListeners('feed-search-result'))) {
      socket.on('feed-search-result', (res) => {
        this.setState({ feedReceived: true, feedResults: res });
      });
    }
  };

  /**
  * Fires on user stream. Emits the query to the server.
  * Handles the Twitter stream response by setting internal app state.
  */
  onStreamSwitch = (checked) => {
    const { feedQuery } = this.state;
    this.setState({
      streamChecked: !this.state.streamChecked
    });
    if (checked) {
      socket.emit('stream-query', feedQuery);
      this.handleStream();
    } else {
      socket.emit('close-stream', '');
      this.setState({
        streaming: false
      });
    }
  };

  /**
  * Handles the server Twitter search response. Saves user query to app state.
  */
  handleStream = () => {
    this.setState({
      streaming: true,
    });
    if (!(socket.hasListeners('stream-result'))) {
      socket.on('stream-result', (res) => {
        const { feedResults } = this.state;
        newResults = [res].concat(feedResults);
        this.setState({
          feedResults: newResults
        });
      });
    }
  }

  /**
   * Renders a tweet card
   */
  renderCard = (tweet) => {
    // top title part of card
    const cardTitle = (
      <Row>
        <Badge>
          <a href={tweet.profile_url}>
            <img
              className="profileImg"
              alt="profile"
              src={tweet.avatar_url}
            />
          </a>
        </Badge>
        <a target="_blank" rel="noopener noreferrer" href={tweet.profile_url}>
          {tweet.author_name}
        </a>
      </Row>
    );
    const tweetLink = (
      <a target="_blank" rel="noopener noreferrer" href={tweet.tweet_url}>Link</a>
    );
    const tweetTime = tweet.date_time.time.split(':');

    // make card
    return (
      <div key={tweet.id}>
        <LazyLoad>
          <Card
            className="card"
            title={cardTitle}
            extra={tweetLink}
          >
            <Row>
              <Col span={22}>
                <Linkify properties={linkifyProperties} >{tweet.text}</Linkify>
              </Col>
              <Col span={2}>
                <Row>
                  <p>
                    {tweet.date_time.week_day},
                  {tweet.date_time.date} {tweet.date_time.month} {tweet.date_time.year}
                  </p>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col span={22} />
              <Col span={2}>
                <Row><p>{tweetTime[0]}:{tweetTime[1]} GMT</p></Row>
              </Col>
            </Row>
          </Card>
        </LazyLoad>
      </div>
    );
  };


  /**
   * Main App render function. Renders React's Virtual DOM.
   */
  render() { // eslint-disable-line
    return (
      <Router>
        <div className="App">
          <Redirect from="/" to="/feed" /> {/* redirect to Feed as home page */}
          <Layout style={{ minHeight: '100vh' }}>
            <Header className="header">
              <Row className="row" type="flex" justify="center">
                <Col span={16} offset={1}>
                  <div><p>Twitter Football Transfers Rumours Search</p></div>
                </Col>
                <Col span={3} offset={1}>
                  <Menu
                    mode="horizontal"
                    defaultSelectedKeys={['1']}
                    style={{ lineHeight: '50px', backgroundColor: 'transparent', marginTop: '7px', borderBottomColor: 'transparent' }}
                  >
                    <Menu.Item className="navItem" key="1">
                      <Link to={'/feed'}>Feed</Link>
                    </Menu.Item>
                    <Menu.Item className="navItem" key="2">
                      <Link to={'/db'}>Database</Link>
                    </Menu.Item>
                  </Menu>
                </Col>
              </Row>
            </Header>
            <Content className="content" >
              <Route path='/feed' component={this.Feed} />
              <Route path='/db' component={this.Database} />
            </Content>
            <Footer style={{ textAlign: 'center' }}>
              Maintained by Northern Lights Team. All bugs to be reported at <Tag><a target="_blank" rel="noopener noreferrer" href="https://github.com/MikhailMS/intelligent-web">Northern Lights Team</a></Tag>
            </Footer>
          </Layout>
        </div>
      </Router>
    );
  }

  /**
   * Renders the Twitter feed results
   */
  renderFeed = () => {
    const { feedResults, streamChecked, feedReceived } = this.state;

    if (feedReceived) {
      const tweetCards = feedResults.map((el) => this.renderCard(el));

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
      // the JSX to render
      return (
        <div className="feed">
          {toggle}
          <Row>
            <CSSTransitionGroup
              transitionName="tweetAnim"
              transitionEnterTimeout={500}
              transitionLeaveTimeout={300}
            >
              {tweetCards}
            </CSSTransitionGroup>
          </Row>
        </div>
      );
    }
  }

  Feed = () => (
    <div>
      <Row className="row" type="flex" justify="center">
        <Col span={18}>
          <Search
            className="searchBar"
            size="large"
            placeholder="Enter feed query ..."
            onSearch={(value) => this.onSearchFeed(value)}
          />
        </Col>
      </Row>
      <Row className="row" type="flex" justify="center">
        <Col span={18}>
          <Tabs
            defaultActiveKey="1"
            onChange={(key) => console.log('tab active: ', key)}
          >
            <TabPane tab="Results" key="1">{this.renderFeed()}</TabPane>
            <TabPane tab="Stats" key="2">Statistics</TabPane>
          </Tabs>
        </Col>
      </Row>
    </div>
  );

  /**
  * Renders the Database results
  */
  renderDB = () => {
    const { dbResults, dbReceived } = this.state;

    if (dbReceived) {
      const tweetCards = dbResults.map((el) => this.renderCard(el));
      // the JSX to render
      return (
        <div className="feed">
          <Row>
            <CSSTransitionGroup
              transitionName="tweetAnim"
              transitionEnterTimeout={500}
              transitionLeaveTimeout={300}
            >
              {tweetCards}
            </CSSTransitionGroup>
          </Row>
        </div>
      );
    }
  }

  Database = () => (
    <div>
      <Row className="row" type="flex" justify="center">
        <Col span={18}>
          <Search
            className="searchBar"
            size="large"
            placeholder="Enter database query ..."
            onSearch={(value) => this.onSearchDB(value)}
          />
        </Col>
      </Row>
      <Row className="row" type="flex" justify="center">
        <Col span={18}>
          <div>{this.renderDB()}</div>
        </Col>
      </Row>
    </div>
  );
}


export default App;
