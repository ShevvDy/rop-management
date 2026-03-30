FROM python:3.12.9

RUN apt-get update -y
RUN apt-get install -y libpq-dev build-essential

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY app_main.py .

CMD ["python", "app_main.py"]
