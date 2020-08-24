// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const {GoogleAuth} = require('google-auth-library');
const businessmessages = require("businessmessages");
const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4');

// Set of commands the bot understands
const CMD_RICH_CARD = 'card';
const CMD_CAROUSEL_CARD = 'carousel';
const CMD_SUGGESTIONS = 'chips';

// Images used in cards and carousel examples
const SAMPLE_IMAGES = [
  'https://storage.googleapis.com/kitchen-sink-sample-images/cute-dog.jpg',
  'https://storage.googleapis.com/kitchen-sink-sample-images/elephant.jpg',
  'https://storage.googleapis.com/kitchen-sink-sample-images/adventure-cliff.jpg',
  'https://storage.googleapis.com/kitchen-sink-sample-images/sheep.jpg',
  'https://storage.googleapis.com/kitchen-sink-sample-images/golden-gate-bridge.jpg',
];

// Initialize the Business Messages API
const bmApi =
    new businessmessages.businessmessages_v1.Businessmessages({});

// Set the scope for API authentication
const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/businessmessages'
});

let authClient = false;

/**
 * The webhook callback method.
 */
router.post('/callback', function(req, res, next) {
  let requestBody = req.body;

  // Log the full JSON payload received
  console.log('requestBody: ' + JSON.stringify(requestBody));
  console.log('requestHeader: ' + JSON.stringify(req.headers));

  // Extract the message payload parameters
  let conversationId = requestBody.conversationId;

  // Check that the message and text values exist
  if (requestBody.message !== undefined
    && requestBody.message.text !== undefined) {
    let message = requestBody.message.text;

    // Log message parameters
    console.log('conversationId: ' + conversationId);
    console.log('message: ' + message);

    routeMessage(message, conversationId);
  } else if (requestBody.suggestionResponse !== undefined) {
    let message = requestBody.suggestionResponse.text;

    // Log message parameters
    console.log('conversationId: ' + conversationId);
    console.log('message: ' + message);

    routeMessage(message, conversationId);
  } else if (requestBody.userStatus !== undefined) {
    if (requestBody.userStatus.isTyping !== undefined) {
      console.log('User is typing');
    } else if (requestBody.userStatus.requestedLiveAgent !== undefined) {
      console.log('User requested transfer to live agent');
    }
  }

  res.sendStatus(200);
});

/**
 * Routes the message received from the user to create a response.
 *
 * @param {string} message The message text received from the user.
 * @param {string} conversationId The unique id for this user and agent.
 */
function routeMessage(message, conversationId) {
  let normalizedMessage = message.trim().toLowerCase();

  console.log('normalizedMessage: ' + normalizedMessage);

  if (normalizedMessage === CMD_RICH_CARD) {
    sendRichCard(conversationId);
  } else if (normalizedMessage === CMD_CAROUSEL_CARD) {
    sendCarousel(conversationId);
  } else if (normalizedMessage === CMD_SUGGESTIONS) {
    sendMessageWithSuggestions(conversationId);
  } else {
    echoMessage(message, conversationId);
  }
}

/**
 * Sends a sample rich card to the user.
 *
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendRichCard(conversationId) {
  let fallbackText = 'Business Messages!!!\n\n'
    + 'This is an example rich card\n\n' + SAMPLE_IMAGES[0];

  sendResponse({
        messageId: uuidv4(),
        representative: {
          representativeType: 'BOT',
        },
        fallback: fallbackText,
        richCard: {
          standaloneCard: {
            cardContent: {
              title: 'Business Messages!!!',
              description: 'This is an example rich card',
              media: {
                height: 'MEDIUM',
                contentInfo: {
                  fileUrl: SAMPLE_IMAGES[0],
                  forceRefresh: false,
                },
              },
              suggestions: getSampleSuggestions(),
            },
          },
        },
      }, conversationId);
}

/**
 * Sends a sample carousel rich card to the user.
 *
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendCarousel(conversationId) {
  let carouselCard = getSampleCarousel();
  let fallbackText = '';

  // Construct a fallback text for devices that do not support carousels
  for (let i = 0; i < carouselCard.cardContents.length; i++) {
    fallbackText += carouselCard.cardContents[i].title + '\n\n'
      + carouselCard.cardContents[i].description + '\n\n'
      + carouselCard.cardContents[i].media.contentInfo.fileUrl + '\n\n'
      + '\n---------------------------------------------\n\n';
  }

  sendResponse({
        messageId: uuidv4(),
        fallback: fallbackText,
        representative: getRepresentative(),
        richCard: {
          carouselCard: carouselCard,
        },
      }, conversationId);
}

/**
 * Creates a sample carousel rich card.
 *
 * @return {object} A carousel rich card.
 */
function getSampleCarousel() {
  let cardContents = [];

  // Create individual cards for the carousel
  for (let i = 0; i < SAMPLE_IMAGES.length; i++) {
    cardContents.push({
      title: 'Card #' + (i + 1),
      description: 'This is a sample card',
      suggestions: getSampleSuggestions(),
      media: {
        height: 'MEDIUM',
        contentInfo: {
          fileUrl: SAMPLE_IMAGES[i],
          forceRefresh: false,
        },
      },
    });
  }

  return {
    cardWidth: 'MEDIUM',
    cardContents: cardContents,
  };
}

/**
 * Sends a message with a suggested replies.
 *
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendMessageWithSuggestions(conversationId) {
  sendResponse({
        messageId: uuidv4(),
        representative: getRepresentative(),
        fallback: 'Your device does not support suggestions',
        suggestions: getSampleSuggestions(),
        text: 'Message with suggestions',
      }, conversationId);
}

/**
 * Sends the message received from the user back to the user.
 *
 * @param {string} message The message text received from the user.
 * @param {string} conversationId The unique id for this user and agent.
 */
function echoMessage(message, conversationId) {
  sendResponse({
        messageId: uuidv4(),
        representative: getRepresentative(),
        text: message,
      }, conversationId);
}

/**
 * Posts a message to the Business Messages API, first sending a typing
 * indicator event and sending a stop typing event after the message
 * has been sent.
 *
 * @param {object} messageObject The message object payload to send to the user.
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendResponse(messageObject, conversationId) {
  if (!authClient) {
    initCredentials();
  }

  // Create the payload for sending a typing started event
  let apiEventParams = {
    auth: authClient,
    parent: 'conversations/' + conversationId,
    resource: {
      eventType: 'TYPING_STARTED',
      representative: getRepresentative()
    },
    eventId: uuidv4(),
  };

  // Send the typing started event
  bmApi.conversations.events.create(apiEventParams,
    {auth: authClient}, (err, response) => {
    console.log(err);
    console.log(response);

    let apiParams = {
      auth: authClient,
      parent: 'conversations/' + conversationId,
      resource: messageObject,
    };

    // Call the message create function using the
    // Business Messages client library
    bmApi.conversations.messages.create(apiParams,
      {auth: authClient}, (err, response) => {
      console.log(err);
      console.log(response);

      // Update the event parameters
      apiEventParams.resource.eventType = 'TYPING_STOPPED';
      apiEventParams.eventId = uuidv4();

      // Send the typing stopped event
      bmApi.conversations.events.create(apiEventParams,
        {auth: authClient}, (err, response) => {
        console.log(err);
        console.log(response);
      });
    });
  });
}

function getRepresentative() {
  return {
    representativeType: 'BOT',
    displayName: 'Echo Bot',
    avatarImage: 'https://storage.googleapis.com/sample-avatars-for-bm/bot-avatar.jpg'
  };
}

/**
 * Initializes the Google credentials for calling the
 * Business Messages API.
 */
async function initCredentials() {
  authClient = await auth.getClient();

  // Initialize auth token
  authClient.refreshAccessToken();
  await authClient.getAccessToken();
}

/**
 * Creates a list of sample suggestions that includes a
 * suggested reply and two actions.
 *
 * @return {array} An array of sample suggested replies.
 */
function getSampleSuggestions() {
  return [
      {
        reply: {
          text: 'Sample Chip',
          postbackData: 'sample_chip',
        },
      },
      {
        action: {
          text: 'URL Action',
          postbackData: 'url_action',
          openUrlAction: {
            url: 'https://www.google.com',
          },
        },
      },
      {
        action: {
          text: 'Dial Action',
          postbackData: 'dial_action',
          dialAction: {
            phoneNumber: '+12223334444',
          },
        },
      },
    ];
}

module.exports = router;
