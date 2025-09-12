from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)
CORS(app)
basedir = os.path.abspath(os.path.dirname(__file__))
dbfile = os.path.join(basedir, 'data.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + dbfile
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class College(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(100))
    fees = db.Column(db.Integer)
    branches = db.Column(db.String(500))  # comma separated

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "fees": self.fees,
            "branches": self.branches.split(',') if self.branches else []
        }

@app.route("/api/hello")
def hello():
    return {"message": "Hello from Flask Backend!"}


@app.route('/api/colleges', methods=['GET'])
def get_colleges():
    cols = College.query.all()
    return jsonify([c.to_dict() for c in cols])

@app.route('/api/recommend', methods=['POST'])
def recommend():
    data = request.json or {}
    pref_branch = data.get('branch', '').lower()
    max_fees = data.get('max_fees') or 9999999

    results = []
    for c in College.query.all():
        score = 0
        if pref_branch and pref_branch in (c.branches or '').lower():
            score += 50
        if c.fees and c.fees <= (max_fees or 9999999):
            score += 30
        # simple tie-breaker
        results.append((score, c))

    results.sort(key=lambda x: x[0], reverse=True)
    top = [c.to_dict() for score,c in results[:10]]
    return jsonify({"results": top})

if __name__ == '__main__':
    if not os.path.exists(dbfile):
        db.create_all()
    app.run(debug=True)
