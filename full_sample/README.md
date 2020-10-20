# BUSINESS MESSAGES: ECHO BOT

This sample demonstrates how to receive a message from the Business Messages
platform and echo the same message back to the user using the Business Messages
Node.js SDK.

The sample also supports the following commands:
* card - The bot responds with a sample rich card
* carousel - The bot responds with a sample carousel
* chips - The bot responds with sample suggested replies

This runs on the Google App Engine.

See the Google App Engine (https://cloud.google.com/appengine/docs/nodejs/) standard environment
documentation for more detailed instructions.

## PREREQUISITES

You must have the following software installed on your development machine:

* [Google Cloud SDK](https://cloud.google.com/sdk/) (aka gcloud)
* [Node.js](https://nodejs.org/en/) - version 10 or above

## SETUP

Register with Business Messages:

    1.  Open [Google Cloud Console](https://console.cloud.google.com) with your
        Business Messages Google account and create a new project for your agent.

        Note the **Project ID** and **Project number** values.

    2.  Open the
        [Business Messages API](https://console.developers.google.com/apis/library/businessmessages.googleapis.com)
        in the API Library.

    3.  Click **Enable**.

    4.  [Register your project](https://developers.google.com/business-communications/business-messages/guides/set-up/register)
        with Business Messages.

Create a Business Messages agent:

    *   Open the [Create an agent](https://developers.google.com/business-communications/business-messages/guides/set-up/agent)
        guide and follow the instructions to create a Business Messages agent.

## RUN THE SAMPLE

    1.  In a terminal, navigate to this sample's root directory.

    2.  Run the following commands:

        gcloud config set project PROJECT_ID

        Where PROJECT_ID is the project ID for the project you created when you registered for
        Business Messages

        gcloud app deploy

    3.  On your mobile device, use the test business URL associated with the
        Business Messages agent you created. Open a conversation with your agent
        and type in "Hello". Once delivered, you should receive "Hello" back
        from the agent.

        Try entering "card", "carousel", and "chips" separately to explore other
        functionality.
