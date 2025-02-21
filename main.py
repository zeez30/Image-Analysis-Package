from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template("index.html")

# Error handler: 404
@app.errorhandler(404)
def page_not_found(error):
   return "Couldn't find the page you requested.", 404

# Run app
if __name__ == "__main__":
       app.run(host='0.0.0.0', debug=True)