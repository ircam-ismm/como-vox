# Data analysis with python

## Install

### Install "real" python from python.org

Python3 should be there: `/Library/Frameworks/Python.framework/Versions/3.8/bin/`

(Or get if from <https://python.org>)

### Install `virtualenv` using this "real" python

```sh
/Library/Frameworks/Python.framework/Versions/3.8/bin/pip3 install virtualenv
```

(This is the only thing to install in core python, except `pip`)

### Create a virtual env inside `analysis` folder

```sh
cd path/to/analysis
/Library/Frameworks/Python.framework/Versions/3.8/bin/virtualenv python3env
```

### To activate the virtual env

```sh
source python3env/bin/activate  # activate virtual env

# check that pip (for example) is the good one
which pip
# it should be within the virtual environment,

# install dependencies
pip install -r requirements.txt
```

### To plot some data

Run python, with `ipython` or you preferred environment.

```python
run como_data.py
data = multiple_sensors_read('./data/20201014-*player*')
figures = multiple_sensors_plot(data)
```

### To close the python virtual environment

```sh
deactivate
```
