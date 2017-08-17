# EasyPoll
======================================

Lightweight, easy to use polling tool that allows teaching staff to gather asynchronous feedback within the Cardiff University Learning Central Virtual Learning Environment (Blackboard) for a variety of purposes, including gauging student opinion, gathering feedback, facilitating voting and stimulating thought and debate.

## Blackboard embed code

Embed the tool using an iframe and include unique Blackboard variables as the unique id for the poll

e.g. iframe src="https://example.com/?poll=@X@course.pk_string@X@@X@content.url@X@"

### Blackboard variables used

ul
li @X@course.pk_string@X@ = Unique course id
li @X@content.url@X@ = Unique content item id

![Image representing EasyPoll](public/images/easypoll.png?raw=true "Image representing EasyPoll")

## Blackboard dynamic rendering with template variables

[community.blackboard.com](https://community.blackboard.com/docs/DOC-1148)

## Technical platform

Node.js and MongoDB

### Platform

[mongodb.com](https://www.mongodb.com/)

[nodejs.org](https://nodejs.org/)
