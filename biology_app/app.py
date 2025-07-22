from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chapter/<int:chapter_number>')
def chapter(chapter_number):
    return render_template(f'chapter_{chapter_number}.html')

if __name__ == '__main__':
    app.run(debug=True)
