#vuxel app
pm2 delete vuxel;
pm2 start npm --name vuxel -i 4 -- start
echo 'start vuxel by pm2';
pm2 save;
sleep 1;
echo 'done...';
exit;

