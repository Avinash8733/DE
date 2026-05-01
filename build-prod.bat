@echo off
echo Building Voice Email System for Production...

echo 1. Installing backend dependencies...
cd voice-email-backend
call npm install
cd ..

echo 2. Installing frontend dependencies...
cd voice-email-frontend
call npm install

echo 3. Building frontend...
call npm run build
cd ..

echo 4. Initializing database (if not exists)...
cd voice-email-backend
call npm run init-db
cd ..

echo.
echo ✅ Production build complete!
echo To run the project in production mode:
echo 1. Set NODE_ENV=production in voice-email-backend/.env
echo 2. Run 'npm start' in voice-email-backend
pause
