@echo off

cd /d C:\Fake-Early-Bird

call npx pm2 start ecosystem.config.cjs

exit