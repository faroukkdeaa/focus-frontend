
Follow these steps to set up the project locally on your machine.

## 📋 Prerequisites
Before you begin, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (Latest LTS version)
- [Git](https://git-scm.com/)

---

## 🛠️ Setup Instructions

### 1. Clone the Repository
Open your terminal and run the following commands to download the project:

```
git clone [https://github.com/faroukkdeaa/focus-frontend.git](https://github.com/faroukkdeaa/focus-frontend.git)
cd focus-frontend.
```
### 2. Frontend Setup (React)
#### Install the required dependencies:

```
npm install
```
#### Environment Variables:
Create a file named .env in the root directory of the project and add your API key:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

#### Start the development server:

```
npm run dev
```

The frontend should now be running at http://localhost:5173

### 3. Temporary Mock Backend (Optional - JSON Server)
You can run the temporary mock API.
Open a new terminal window in the project directory and run:
```
npx json-server --watch db.json --port 3001
```
The mock API will be running at http://localhost:3001
