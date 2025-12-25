# RideTribe

RideTribe is a carpooling application designed to connect users with similar commute routes, fostering a community-driven approach to transportation. It allows users to create and join "tribes," schedule rides, and find matches for their daily commutes.

## Features

-   **User Authentication**: Secure signup and login functionality using phone number and password.
-   **Tribe Management**: Create and manage your own tribes or join existing ones.
-   **Ride Scheduling**: Schedule rides for specific dates and times.
-   **Ride Matching**: Find potential ride matches based on your schedule and location.
-   **Google Maps Integration**: Visualizing routes and destinations (Integration in progress).
-   **Responsive Design**: A user-friendly interface optimized for both desktop and mobile devices.

## Tech Stack

### Frontend

-   **Framework**: React (with Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **UI Components**: shadcn/ui (Radix UI)
-   **State Management**: React Context API
-   **Routing**: React Router DOM
-   **Maps**: @vis.gl/react-google-maps
-   **HTTP Client**: Axios (via custom api wrapper)
-   **Icons**: Lucide React

### Backend

-   **Framework**: FastAPI
-   **Language**: Python
-   **Database**: MongoDB (via Motor driver)
-   **Authentication**: JWT (JSON Web Tokens) with Passlib (bcrypt)
-   **Validation**: Pydantic

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   Python (v3.8 or higher)
-   MongoDB instance (local or cloud)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/WaleedAdnan08/RideTribe.git
    cd RideTribe
    ```

2.  **Backend Setup:**

    Navigate to the backend directory and install dependencies:

    ```bash
    cd backend
    python -m venv venv
    # Activate virtual environment:
    # Windows: venv\Scripts\activate
    # macOS/Linux: source venv/bin/activate
    pip install -r requirements.txt
    ```

    Create a `.env` file in the `backend` directory with your configuration (DB connection string, secret keys, etc.).

3.  **Frontend Setup:**

    Navigate to the frontend directory and install dependencies:

    ```bash
    cd ../frontend
    npm install
    # or
    pnpm install
    ```

    Create a `.env` file in the `frontend` directory if needed (e.g., for API base URL).

### Running the Application

1.  **Start the Backend:**

    ```bash
    # From the backend directory
    uvicorn main:app --reload
    ```

2.  **Start the Frontend:**

    ```bash
    # From the frontend directory
    npm run dev
    ```

3.  Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
