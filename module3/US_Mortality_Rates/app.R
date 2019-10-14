library(shiny)
library(plotly)
library(tidyverse)
df <- read.csv(file = "https://raw.githubusercontent.com/charleyferrari/CUNY_DATA608/master/lecture3/data/cleaned-cdc-mortality-1999-2010-2.csv")


# Define UI for application that draws a histogram
ui <- fluidPage(
   
   # Application title
   titlePanel("United States Mortality Rates"),
   tabsetPanel(
     tabPanel("2010 Mortality Rates", fluid = TRUE,
              sidebarLayout(
                sidebarPanel(
                  tags$b("Question"),
                  tags$br(),
                  h5(paste("As a researcher, you frequently compare mortality rates from particular causes across different States.",
                             "You need a visualization that will let you see (for 2010 only) the crude mortality rate, across all States,",
                             "from one cause (for example, Neoplasms, which are effectively cancers). ",
                              "Create a visualization that allows you to rank States by crude mortality for each cause of death."
                              )),
                  tags$br(),
                  selectInput("reason", "Cause of Death:",
                              choices = (unique(subset(df, Year == 2010)$ICD.Chapter)), 
                              selected = NULL, 
                              multiple = FALSE,
                              selectize = TRUE, width = NULL, size = NULL),
                  tags$br(),
                  sliderInput("nstates", "Amount of States to Rank:", min = 1, max = 10, value = 5),
                  tags$br(),
                  tags$b("Ranking Selection"),
                  tags$br(),
                  actionButton("top", paste("Top Mortality States")),
                  actionButton("bot", paste("Bottom Mortality States")),
                  tags$br(),
                  tags$br(),
                  tableOutput("q1b"),
                  tags$br(),
                  width = 3),
                
                # Show a plot of the generated distribution
                mainPanel(
                  fluidRow(
                    column(8,                   
                           tags$br(),
                           tags$br(),
                           plotlyOutput("q1a"), 
                           align="left")
                           )
                  )
                )
),
tabPanel("Change in Mortality Rates", fluid = TRUE,
         sidebarLayout(
           sidebarPanel(
             tags$b("Question"),
             tags$br(),
             h5(paste("Often you are asked whether particular States are improving their mortality rates (per cause) faster than,",
                      "or slower than, the national average. Create a visualization that lets your clients see this for themselves",
                      "for one cause of death at the time.",
                      "Keep in mind that the national average should be weighted by the national population. "
             )),
             tags$br(),
             selectInput("reason2", "Cause of Death:",
                         choices = (unique(subset(df, Year == 2010)$ICD.Chapter)), 
                         selected = NULL, 
                         multiple = FALSE,
                         selectize = TRUE, width = NULL, size = NULL),
             tags$br(),
             selectInput("state", "State:",
                         choices = (unique(df$State)), 
                         selected = NULL, 
                         multiple = FALSE,
                         selectize = TRUE, width = NULL, size = NULL),
             tags$br(),
             tableOutput("q2b"),
             width = 3),
           
           # Show a plot of the generated distribution
           mainPanel(
             fluidRow(
               column(8,                   
                      tags$br(),
                      tags$br(),
                      plotlyOutput("q2a"), 
                      align="left")
             )
           )
         )
)))
# Define server logic required to draw a histogram
server <- function(input, output) {

  v <- reactiveValues(data = NULL)
  observeEvent(c(input$bot, input$reason),  {
    df_2010 <- subset(df, ICD.Chapter == input$reason & Year == 2010)
    v$ranked <- df_2010 %>% arrange(Crude.Rate) %>% select(State, Crude.Rate)
   }, ignoreInit = TRUE)
  
  observeEvent(c(input$top, input$reason), {
    df_2010 <- subset(df, ICD.Chapter == input$reason & Year == 2010)
    v$ranked <- df_2010 %>% arrange(desc(Crude.Rate)) %>% select(State, Crude.Rate)
  }, ignoreInit = TRUE)
  
   output$q1a <- renderPlotly({
     df_2010 <- subset(df, ICD.Chapter == input$reason & Year == 2010)
     
     df_2010$hover <- with(df_2010, paste("Deaths:", Deaths,'<br>',"Population:", Population))
     # give state boundaries a white border
     l <- list(color = toRGB("white"), width = 2)
     # specify some map projection/options
     g <- list(
       scope = 'usa',
       projection = list(type = 'albers usa'),
       showlakes = TRUE,
       lakecolor = toRGB('white')
     )
     
     plot_geo(df_2010, locationmode = 'USA-states') %>%
       add_trace(
         z = ~Crude.Rate, locations = ~State, text = ~hover, 
         color = ~Crude.Rate, colors = 'YlOrRd'
       ) %>%
       colorbar(title = "Rate <br>") %>%
       layout(
         title = '2010 US Mortality Rates, by Cause of Death', 
         annotations = list(x = 1, y = -0.1, text = input$reason, showarrow = F),
         geo = g
         
       )
   })

  output$q1b <- renderTable({
    #df_2010 <- subset(df, ICD.Chapter == input$reason & Year == 2010)
    head(v$ranked, n=input$nstates)
})

  output$q2a <- renderPlotly({
    df_temp <- df %>% group_by(Year, ICD.Chapter) %>% 
      summarise(Crude.Rate = (sum(Deaths)/sum(Population)) * 100000) %>% 
      mutate(State = 'National') %>% 
      mutate_if(is.factor, as.character)
    df_nat_avg <- df %>% 
      select(c("Year", "ICD.Chapter", "Crude.Rate", "State")) %>% 
      mutate_if(is.factor, as.character) %>% 
      bind_rows(df_temp)
    p <- plot_ly(subset(df_nat_avg, ICD.Chapter == input$reason2 & (State == input$state | State == 'National')), 
                 x = ~Year, y = ~Crude.Rate, split = ~State, type = 'scatter', mode = 'lines+markers') %>%
      layout(
        title = 'Mortality Rates Over Time, by State and Cause of Death'
      )
    p
  })
  
  
  output$q2b <- renderTable({
    max_year = max(unique(subset(df_nat_avg, ICD.Chapter == input$reason2 & State == input$state)$Year))
    min_year = min(unique(subset(df_nat_avg, ICD.Chapter == input$reason2 & State == input$state)$Year))
    state_max = subset(df_nat_avg, ICD.Chapter == input$reason2 & State == input$state & Year == max_year)$Crude.Rate
    state_min = subset(df_nat_avg, ICD.Chapter == input$reason2 & State == input$state & Year == min_year)$Crude.Rate
    nat_max = subset(df_nat_avg, ICD.Chapter == input$reason2 & State == 'National' & Year == max_year)$Crude.Rate
    nat_min = subset(df_nat_avg, ICD.Chapter == input$reason2 & State == 'National' & Year == min_year)$Crude.Rate
    
    
    change_state = (state_max - state_min)/(max_year - min_year)
    change_nat = (nat_max - nat_min)/(max_year - min_year)
    
    p1 <- round(change_state, 3)
    p2 <- round(change_nat, 3)
    
    x <- data.frame(p1,p2)
    colnames(x) = c(paste("The rate of change of", input$state, "mortality rate between",min_year,"and",max_year), 
                                paste("The rate of change of national mortality rate between",min_year,"and",max_year))
    x
    
  })
}
# Run the application 
shinyApp(ui = ui, server = server)

