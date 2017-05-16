import React, { Component } from 'react';
import LazyLoad from 'react-lazy-load';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import { Layout, Row, Col, Input, Tag, Tabs, Card, Badge, Switch } from 'antd';
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
      searchReceived: false,
      streamChecked: false,
      streaming: false,
      twitResults: {},
      query: ''
    };
  }

  onTabChange = (key) => {
    this.setState({
      tabSelected: key
    });
    this.handleSearch();
  }

  /**
   * Triggered when the user submits a new query via the search bar.
   */
  onSearch = (query) => {
    this.setState(
      {
        query,
        streamChecked: false,
      },
      this.handleSearch); //wait for setState to finish and handle the search
  }

  /**
  * Handles a change of search. This includes either Twitter or DB search.
  */
  handleSearch = () => { //eslint-disable-line
    const { tabSelected, query } = this.state;

    // close stream if one was open
    socket.emit('close-stream', '');
    this.setState({
      streamChecked: false,
    });

    // determine if result is to come from db or Twitter search
    const db_only = (tabSelected === 2); //eslint-disable-line
    socket.emit('search-query', {
      query,
      db_only
    });

    // declare a socket listener that updates on 'search-result' events
    if (!(socket.hasListeners('search-result'))) { // check if created so only 1 listener is created
      socket.on('search-result', (res) => {
        this.setState({
          searchReceived: true,
          twitResults: res
        });
      });
    }
  };

  /**
  * Fires on user stream. Emits the query to the server.
  * Handles the Twitter stream response by setting internal app state.
  */
  onStreamSwitch = (checked) => {
    const { query } = this.state;
    this.setState({
      streamChecked: !this.state.streamChecked
    });
    if (checked) {
      socket.emit('stream-query', query);
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
        const { twitResults } = this.state;
        newResults = [res].concat(twitResults);
        this.setState({
          twitResults: newResults
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
                <Row><p>{tweet.date_time.time} GMT</p></Row>
              </Col>
            </Row>
          </Card>
        </LazyLoad>
      </div>
    );
  };

  /**
   * Renders the whole Twitter Search and Stream Feed
   */
  renderFeed = (key) => {
    const { twitResults, streamChecked, searchReceived, tabSelected } = this.state;

    if (searchReceived && key === tabSelected) {
      const tweetCards = twitResults.map((el) => this.renderCard(el));

      // conditional rendering for the 'Stream' toggle
      let toggle;
      if (tabSelected === '1') {
        toggle = (
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
      } else toggle = null;

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

  /**
   * Main app render function. Renders React's Virtual DOM.
   */
  render() {
    return (
      <div className="App">
        <Layout style={{ minHeight: '100vh' }}>
          <Header className="header">Twitter Football Transfers Rumours Search</Header>
          <Content className="content" >
            <Row className="row" type="flex" justify="center">
              <Col span={18}>
                <Search
                  className="searchBar"
                  size="large"
                  placeholder="Query search. For example, '@ibra_official AND #manutd AND from:@WayneRooney' "
                  onSearch={(value) => this.onSearch(value)}
                />
              </Col>
            </Row>
            <Row className="row" type="flex" justify="center">
              <Col span={18}>
                <Tabs
                  defaultActiveKey="1"
                  onChange={(key) => this.onTabChange(key)}
                >
                  <TabPane tab="Feed" key="1">{this.renderFeed('1')}</TabPane>
                  <TabPane tab="Database" key="2">{this.renderFeed('2')}</TabPane>
                  <TabPane tab="Statistics" key="3">Stats</TabPane>
                </Tabs>
              </Col>
            </Row>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Maintained by Northern Lights Team. All bugs to be reported at <Tag><a target="_blank" rel="noopener noreferrer" href="https://github.com/MikhailMS/intelligent-web">Northern Lights Team</a></Tag>
          </Footer>
        </Layout>
      </div >
    );
  }
}

export default App;
