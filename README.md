# erespondentN

![Python](https://img.shields.io/badge/python-3.10-blue)
[![Built by shlneo](https://img.shields.io/badge/Built%20by-Shlneo%20-blue)](https://github.com/shlneo)

### Info

The web application automates the processes of respondents forming reports in the form of departmental quarterly reports — "Information on consumption rates and (or) marginal levels of consumption of fuel and energy resources."

### Version

3.7.14 - byPostgre

### Requirements

- python `3.10.0`
- add `.env` + `files/ministerstvo` + `files/organizations`
- PostgreSql `17`

### Database Settings

1. Make a user `...` and give him pass `...`.

2. Create database `...` with superuser `...`.

### Installation app

1. Clone the `erespondentN` repository.

2. Create a virtual environment:
```bash 
python -m venv .venv
```

3. Activate the virtual environment:
```bash 
.venv\Scripts\activate
```

4. Install the libraries:
```bash 
pip install -r requirements.txt
```

### Launch

```bash 
python main.py
```

### Link

[erespondentn.energoeffect.gov.by](https://erespondentn.energoeffect.gov.by/)