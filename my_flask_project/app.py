from flask import Flask, request, jsonify, session
from flask_mysqldb import MySQL
from flask_bcrypt import Bcrypt
from functools import wraps
from flask_cors import CORS
import numpy as np
import jwt
import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# MySQL configurations
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'pfa'

mysql = MySQL(app)
bcrypt = Bcrypt(app)
CORS(app)  # Enable CORS for all routes
# JWT configuration
JWT_SECRET = 'your_jwt_secret'
JWT_ALGORITHM = 'HS256'
JWT_EXP_DELTA_SECONDS = 3600

class FuzzyAHP:
    def calculate_weights(self, data):
        pairwise_matrix = np.array(data["pairwise_matrix"])
        row_sums = np.sum(pairwise_matrix, axis=1)
        normalized_matrix = pairwise_matrix / row_sums[:, None]
        weights = np.mean(normalized_matrix, axis=0)
        return {"weights": weights.tolist()}
    
    
class FuzzyTOPSIS:
    def calculate_rankings(self, data):
        decision_matrix = np.array(data["decision_matrix"])
        criteria_names = data["criteria_names"]

        # Normalize the decision matrix
        norm_decision_matrix = decision_matrix / np.sqrt((decision_matrix ** 2).sum(axis=0))

        # Assuming equal weights for simplicity, adjust as needed
        weights = np.ones(decision_matrix.shape[1])
        weighted_matrix = norm_decision_matrix * weights

        # Determine positive and negative ideal solutions
        pos_ideal_solution = np.max(weighted_matrix, axis=0)
        neg_ideal_solution = np.min(weighted_matrix, axis=0)

        # Calculate distances to ideal solutions
        pos_distance = np.sqrt(((weighted_matrix - pos_ideal_solution) ** 2).sum(axis=1))
        neg_distance = np.sqrt(((weighted_matrix - neg_ideal_solution) ** 2).sum(axis=1))

        # Calculate closeness coefficient
        closeness = neg_distance / (pos_distance + neg_distance)

        # Rank the criteria based on closeness coefficient
        ranked_indices = closeness.argsort()[::-1]
        rankings = {criteria_names[i]: rank + 1 for rank, i in enumerate(ranked_indices)}

        return {"rankings": rankings}

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization').split(" ")[1] if request.headers.get('Authorization') else None
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    existing_user = cur.fetchone()

    if existing_user:
        return jsonify({"error": "User already registered with this email."}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    print(f"Registering user with hashed password: {hashed_password}")

    cur.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)", (username, email, hashed_password))
    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "You have successfully registered!"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE email = %s", [email])
    user = cur.fetchone()
    cur.close()

    if user and bcrypt.check_password_hash(user[3], password):
        payload = {
            'email': email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXP_DELTA_SECONDS)
        }
        token = jwt.encode(payload, JWT_SECRET, JWT_ALGORITHM)
        return jsonify({'token': token}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    # With JWT, logout can be handled client-side by deleting the token
    return jsonify({"message": "Successfully logged out."}), 200

@app.route('/api/fuzzy-ahp', methods=['POST'])
@token_required
def fuzzy_ahp():
    data = request.json
    ahp = FuzzyAHP()
    result = ahp.calculate_weights(data)
    return jsonify(result)

@app.route('/api/fuzzy-topsis', methods=['POST'])
@token_required
def fuzzy_topsis():
    data = request.json
    topsis = FuzzyTOPSIS()
    result = topsis.calculate_rankings(data)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
