#!/usr/bin/env sh
~/.nvm/versions/node/v6.6.0/bin/node /home/ec2-user/smarttoolsV2/convert.js > /home/ec2-user/smarttoolsV2/cron.log
~/.nvm/versions/node/v6.6.0/bin/node /home/ec2-user/smarttoolsV2/email.js > /home/ec2-user/smarttoolsV2/emailcron.log