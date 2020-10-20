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
const businessmessages = require('businessmessages');
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
  scopes: 'https://www.googleapis.com/auth/businessmessages',
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

  // TODO: Update the routing to call the appropriate function
  // based on matching the normalizedMessage value to the
  // supported commands for chips, cards, and carousels.

  echoMessage(message, conversationId);
}

/**
 * Sends a sample rich card to the user.
 *
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendRichCard(conversationId) {
  // TODO: Use the sendResponse function to send a rich card with
  // a title, description, image, a suggested reply, an action
  // to open the phone's dialer, and an action to open a URL.
}

/**
 * Sends a sample carousel rich card to the user.
 *
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendCarousel(conversationId) {
  // TODO: Use the sendResponse function to send a carousel
  // using the SAMPLE_IMAGES as the media element. Each card should
  // have a title, description, image, a suggested reply, an action
  // to open the phone's dialer, and an action to open a URL.
}

/**
 * Sends a message with a suggested replies.
 *
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendMessageWithSuggestions(conversationId) {
  // TODO: Use the sendResponse function to send a text message
  // with chips for a suggested reply, an action
  // to open the phone's dialer, and an action to open a URL.
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
      representative: getRepresentative(),
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
    avatarImage: 'https://storage.googleapis.com/sample-avatars-for-bm/bot-avatar.jpg',
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
