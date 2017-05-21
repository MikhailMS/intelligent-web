import React, { Component } from 'react';
import { Card, Row, Col } from 'antd';

class PlayerCard extends Component {

    /**
     * Renders a player card
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
            let counter = 0;
            let abstractString = '';
            while (counter <= NUM_OF_SEN) {
                if (!(typeof abstract[counter] === 'undefined')) {
                    counter++;
                    abstractString = `${abstractString}${abstract[counter]}. `;
                }
            }

            let position = playerData.position.split(' ');
            position = position[0]; // limit to only 1 word
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
