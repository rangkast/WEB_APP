#front app
pm2 delete three_app;
pm2 start ./three_app.js -i 2 --name three_app;
echo 'start three_app by pm2';
pm2 save;
sleep 1;
echo 'done...';
exit;
