from app import db, College, app   # make sure you import app too

with app.app_context():
    db.create_all()
    sample = [
        College(name="GCTC", location="Hyderabad", fees=100000, branches="CSE,IT,EEE"),
        College(name="Tech College", location="Hyderabad", fees=140000, branches="CSE,CSE-Cyber,AI"),
    ]
    db.session.bulk_save_objects(sample)
    db.session.commit()
    print("Seeded DB")
