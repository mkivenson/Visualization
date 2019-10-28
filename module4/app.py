# -*- coding: utf-8 -*-
import dash
import dash_core_components as dcc
import dash_html_components as html
import pandas as pd
from sodapy import Socrata
import plotly.graph_objects as go
import plotly.express as px

token = "pk.eyJ1IjoibWtpdmVuc29uIiwiYSI6ImNrMjljbGkxcjExamwzbW9qeGR0aHk1cDcifQ.PCzDqnDF1D_WLD6r9y34jA"
records = str(50000)

def get_trees(records):
    client = Socrata("data.cityofnewyork.us", None)
    results = client.get("uvpi-gqnh", 
                         limit=records, 
                         order='tree_id')

    # Convert to pandas DataFrame
    trees = pd.DataFrame.from_records(results).astype({'stump_diam':'int','latitude': 'float64', 'longitude': 'float64'})
    trees.health = trees.health.fillna('Stump/Dead')
    return trees

df = get_trees(records)

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']

app = dash.Dash(__name__, external_stylesheets=external_stylesheets)

colors = {
    'background': '#F8F8FF',
    'view_bg': 'white',
    'text': '#0b4f1a',
    'panel': 'white'
}

fig_map = dcc.Graph(id='map',
                    figure= px.scatter_mapbox(df, lat='latitude', 
                            lon='longitude', 
                            hover_name='address', 
                            color = 'health',
                            hover_data=['status', 'health'],
                            zoom=9).update_layout(mapbox_style="dark", 
                                  mapbox_accesstoken=token, 
                                  margin={"r":0,"t":0,"l":0,"b":0},
                                  showlegend=False)
                                )


fig_heat = dcc.Graph(id='heat',
                     figure = go.Figure(data=go.Heatmap(
                             z=[list(pd.pivot_table(df, index='health', columns='steward', values = 'tree_id', aggfunc=len).fillna(0).iloc[0].values), 
                                list(pd.pivot_table(df, index='health', columns='steward', values = 'tree_id', aggfunc=len).fillna(0).iloc[1].values),
                                list(pd.pivot_table(df, index='health', columns='steward', values = 'tree_id', aggfunc=len).fillna(0).iloc[2].values)],
                            x=list(pd.pivot_table(df, index='health', columns='steward', values = 'tree_id', aggfunc=len).columns),
                            y=list(pd.pivot_table(df, index='health', columns='steward', values = 'tree_id', aggfunc=len).index.values))).update_layout(
                    title=go.layout.Title(
                            text="Heatmap of Steward Counts vs Tree Health",
                            xref="paper",
                            x=0
                            ),    
                    xaxis=go.layout.XAxis(
                            title=go.layout.xaxis.Title(
                                text="Amount of Stewards",
                                font=dict(
                                    size=11,
                                )
                            )
                        ),
                        yaxis=go.layout.YAxis(
                            title=go.layout.yaxis.Title(
                                text="Tree Health",
                                font=dict(
                                    size=11,
                                )
                            )
                        )
                    ),
                    style={'height': 500},
                                )

tab1 = dcc.Tab(
        label='About',
        value='what-is',
        children=html.Div(className='control-tab', 
                          children=[
                                  html.H4(children='2015 Street Tree Census Data'),
                                  html.P("""
                                         Street tree data was collected from the TreesCount! 2015 Street Tree Census, conducted by 
                                         volunteers and staff organized by NYC Parks & Recreation and partner organizations. 
                                         Tree data collected includes tree species, diameter and perception of health. 
                                         """),
                                  html.H6("Select the number of trees to view on the map"),
                                  html.P("""
                                         Note - more records will slow the dashboard.
                                         """),
                                  dcc.Slider(id='records',
                                                min=10000,
                                                max=650000,
                                                marks = {i: str(int(i/1000))+'k' for i in range(50000,700000,50000)},
                                                step=50000,
                                                value=10000
)  
                                         ])
                                         )
                                           

tab2 = dcc.Tab(
        label='Tree Health',
        value='tree_health',
        children=html.Div(className='control-tab', children=[
                html.H4(children='What proportion of trees are in good, fair, or poor health?'),
                html.P('You can view tree health proportions using the following variables.'),
                
                html.H6(children='Tree Health by Borough'),
                dcc.Dropdown(
                        id='boroname',
                        options=[{'label': i, 'value': i} for i in list(df.boroname.unique())],
                        value= [],
                        multi=True),
                html.Div(id='output-container'),
                html.H6(children='Tree Health by Tree Type'),
                dcc.Dropdown(
                        id='spc_common',
                        options=[{'label': i, 'value': i} for i in list(df.fillna('None').spc_common.unique())],
                        value= [],
                        multi=True),
                html.Div(id='output-container1')
                        ])
            )
                                                    
tab3 =  dcc.Tab(
        label='Stewards',
        value='stewards',
        children=html.Div(className='control-tab', children=[
                html.H4(children='Are stewards having an inpact on the health of trees?'),
                html.P('The stewards field indicates the number of unique signs of stewardship observed for each tree. Not recorded for stumps or dead trees.'),
                fig_heat
            ])
    )

app.layout = html.Div(
        className='row',
        style={'backgroundColor': colors['background']}, 
        children=[html.Div(className='four columns dropper',
                           style={'backgroundColor': colors['view_bg'], 'height': '95vh', 'padding': '15px'},
                           children=[
                                   html.H1(children='NYC Tree Health Overview',style={'textAlign': 'center','color': colors['text']}),
                                   html.Div(id='tab_box', className='control-tabs', children=[
                                           dcc.Tabs(id='tabs', value='what-is', children=[
                                           tab1,
                                           tab2,
                                           tab3
                                           ])
                                ])
                            ]),
                html.Div(className='eight columns dropper',
                    style={'backgroundColor': colors['view_bg'], 'height': '95vh', 'padding': '15px'},
                        children=[
                            html.H1(children='Tree Location',style={'textAlign': 'center','color': colors['text']}),
                            html.P(children='Hover for more detail (color-coded by tree health)'),
                            html.Div(id='fig_map')
                ])

])
                    
@app.callback(
    dash.dependencies.Output('fig_map', 'children'),
    [dash.dependencies.Input('records', 'value')])
def update_output(value):
    df = get_trees(value)
    fig_map = dcc.Graph(id='map',
                    figure= px.scatter_mapbox(df, lat='latitude', 
                            lon='longitude', 
                            hover_name='address', 
                            color = 'health',
                            hover_data=['status', 'health'],
                            zoom=9).update_layout(mapbox_style="dark", 
                                  mapbox_accesstoken=token, 
                                  margin={"r":0,"t":0,"l":0,"b":0},
                                  showlegend=False)
                                )
    return fig_map

@app.callback(
    dash.dependencies.Output('output-container', 'children'),
    [dash.dependencies.Input('boroname', 'value')])
def update_output(value):
    data = (pd.DataFrame(df[df['boroname'].isin(value)]
                     .groupby(by='health')
                     .size()/len(df[df['boroname'].isin(value)]))
        .rename(columns={0:'proportion'})
        .reset_index()
        .replace('Good','1 - Good')
        .replace('Fair','2 - Fair')
        .replace('Poor','3 - Poor')
        .replace('Stump/Dead','4 - Stump/Dead')
        .sort_values(by='health')
        .round(3)
        )
    
    fig_table = dcc.Graph(id='health-table',
                                      figure= go.Figure(data=[go.Table(
                                              header=dict(values=['Health', 'Proportion'], align='left'),
                                              cells=dict(values=[data.health, data.proportion], align='left'))
                                            ],
                                        layout=go.Layout(
                                            margin=go.layout.Margin(l=40, r=0, t=40, b=30)
                                            )
                                    ),
                                    style={'width': 300, 'height': 200, 'backgroundColor': colors['panel']}
                                )
    return fig_table


@app.callback(
    dash.dependencies.Output('output-container1', 'children'),
    [dash.dependencies.Input('spc_common', 'value')])
def update_output1(value):
    data = (pd.DataFrame(df[df['spc_common'].isin(value)]
                     .groupby(by='health')
                     .size()/len(df[df['spc_common'].isin(value)]))
        .rename(columns={0:'proportion'})
        .reset_index()
        .replace('Good','1 - Good')
        .replace('Fair','2 - Fair')
        .replace('Poor','3 - Poor')
        .replace('Stump/Dead','4 - Stump/Dead')
        .sort_values(by='health')
        .round(3)
        )
    
    fig_table = dcc.Graph(id='health-table',
                                      figure= go.Figure(data=[go.Table(
                                              header=dict(values=['Health', 'Proportion'], align='left'),
                                              cells=dict(values=[data.health, data.proportion], align='left'))
                                            ],
                                        layout=go.Layout(
                                            margin=go.layout.Margin(l=40, r=0, t=40, b=30)
                                            )
                                    ),
                                    style={'width': 300, 'height': 200, 'backgroundColor': colors['panel']}
                                )
    return fig_table

if __name__ == '__main__':
    app.run_server(debug=True)