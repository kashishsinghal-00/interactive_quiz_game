from flask import Flask, jsonify, request
from flask_cors import CORS # type: ignore
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt # type: ignore
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity # type: ignore
import json
import os

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

app.config["JWT_SECRET_KEY"] = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-key-123!@#') # CHANGE THIS!
jwt = JWTManager(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quiz.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.String(500), nullable=False)
    options_json = db.Column(db.String(500), nullable=False)
    correct_answer = db.Column(db.String(100), nullable=False)

    @property
    def options(self):
        return json.loads(self.options_json)

    def to_dict(self):
        return {
            "id": self.id,
            "question": self.question_text,
            "options": self.options,
            "correctAnswer": self.correct_answer
        }

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

initial_questions_data = [
    # Make sure all your 15 questions are listed here
    {
        "id": 1,
        "question": "Who is the CEO of Google?",
        "options": ["Satya Nadella", "Sundar Pichai", "Tim Cook", "Mark Zuckerberg"],
        "correctAnswer": "Sundar Pichai"
    },
    # ... (rest of your 14 questions)
    {
        "id": 15,
        "question": "Which protocol is used to transfer web pages over the Internet?",
        "options": ["FTP", "SMTP", "HTTP", "IP"],
        "correctAnswer": "HTTP"
    }
]

# --- Routes ---
@app.route('/')
def hello_world():
    return 'Hello, World! Your Python backend is running with database and auth setup started.'

@app.route('/api/questions', methods=['GET'])
def get_questions():
    print("LOG: Attempting to fetch questions from database...")
    try:
        all_db_questions = Question.query.all()
        if not all_db_questions:
            print("LOG: No questions found in the database.")
            return jsonify({"msg": "No questions found in database"}), 404
            
        questions_dict_list = [q.to_dict() for q in all_db_questions]
        print(f"LOG: Successfully fetched {len(questions_dict_list)} questions.")
        return jsonify(questions_dict_list)
    except Exception as e:
        print(f"LOG: Error fetching questions from database: {e}")
        return jsonify({"msg": "Error fetching questions from database", "error": str(e)}), 500

# --- User Authentication API Endpoints ---
@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Missing username, email, or password"}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Username already exists"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(username=username, email=email, password_hash=hashed_password) # type: ignore
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"msg": "Missing username or password"}), 400

    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()

    if user and bcrypt.check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token, username=user.username), 200
    else:
        return jsonify({"msg": "Bad username or password"}), 401

# --- Helper function to create database and tables ---
def init_db():
    with app.app_context(): 
        db.create_all() 
        print("Database tables (Question, User) created (if they didn't exist).")
        
        if not Question.query.first():
            print("Question table is empty. Populating with initial data...")
            for q_data in initial_questions_data:
                options_as_json_string = json.dumps(q_data["options"])
                new_question = Question(
                    id=q_data["id"],
                    question_text=q_data["question"], # type: ignore
                    options_json=options_as_json_string, # type: ignore
                    correct_answer=q_data["correctAnswer"] # type: ignore
                )
                db.session.add(new_question)
            db.session.commit() 
            print(f"{len(initial_questions_data)} questions added to the database.")
        else:
            print("Question table already contains data. No initial data was added for questions.")
        
        if not User.query.first():
            print("User table is empty.")
        else:
            print("User table already has some users or is ready.")

if __name__ == '__main__':
    app.run(debug=True)