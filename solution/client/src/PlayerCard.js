/**
 * PlayerCard.js
 * 
 * A component that creates a player card,
 * displayed at the top of Feed Search section.
 * It takes DBPedia player data from the server, 
 * and either renders a loading or a populated card.
 * 
 * @author Petar Barzev
 * 
 * Last updated: 22/05/2017
 */

import React, { Component } from 'react';
import { Card, Row, Col } from 'antd';

class PlayerCard extends Component {

    /**
     * Main React render method, executed every time state/props update.
     */
    render() {
        const { playerData, title } = this.props; // data supplied as prop from parent

        // render player card if data is received
        if (playerData) {
            // process data. prepare for rendering. European birthdate standard.
            const birthDate = playerData.birth_date.split('-');
            // use standard European date/time format
            const birthDateString = `${birthDate[2]}\\${birthDate[1]}\\${birthDate[0]}`;

            // limit abstract to 3 sentences
            const abstract = playerData.abstract.split('. ');
            const NUM_OF_SEN = 3; // maximum 3 sentences from abstract
            let abstractString = '';
            for (let i = 0; i < NUM_OF_SEN; i++) {
                if (typeof abstract[i] !== 'undefined') {
                    abstractString = `${abstractString}${abstract[i]}. `;
                }
            }

            // extract only 1 word from position field
            const position = playerData.position.split(' ')[0];

            return (
                <Card className="playerCard" bodyStyle={{ padding: 0 }}>
                    <Col span={6} className="cardLeft">
                        <div className="custom-image">
                            <img alt="player" src={playerData.thumbnail_url} />
                        </div>
                    </Col>
                    <Col span={18} className="cardRight">
                        <div className="custom-card">
                            <div className="playerCardTitle">
                                <Col span={9}>
                                    <h3>{playerData.fullname}</h3>
                                    <h3>{birthDateString}</h3>
                                </Col>
                                <Col span={9} offset={6}>
                                    <Row><h3 className="right">{playerData.current_club}</h3></Row>
                                    <Row><h3 className="right">{position}</h3></Row>
                                </Col>
                            </div>
                            <div className="playerCardContent">
                                <p>{abstractString}</p>
                            </div>
                        </div>
                    </Col>
                </Card>
            );
        } else if (title) { // render a loading card if only title is received
            return (
                <Card className="loadingCard" loading title={title} style={{ width: '100%' }}>
                    This is a loading card
                </Card>
            );
        } return null; // render nothing
    }
}

export default PlayerCard;
