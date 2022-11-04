#back app
pm2 delete back_app;
pm2 start ./back_app.py --name back_app --interpreter python3;
echo 'start back_app by pm2';
pm2 save;
sleep 1;
echo 'done...';
exit;
