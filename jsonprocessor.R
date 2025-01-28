library(jsonlite)
library(dplyr)
library(readr)
library(stringr)
library(tibble)
library(purrr)   
library(tidyr)   

# read in jatos data, but not in typical json so convert to 
# "ndjson" (newline separated instead of comma separated)
raw_text <- read_file("/Users/zachtefertiller/Desktop/bart_only.json")  
ndjson_text <- str_replace_all(raw_text, "\\}\\{", "\\}\n\\{")
write_file(ndjson_text, "/Users/zachtefertiller/Desktop/bart.ndjson")  
# read in line by line (each line is its own json)
lines <- readLines("/Users/zachtefertiller/Desktop/bart.ndjson")

# turn each line into list
parsed <- lapply(seq_along(lines), function(i) {
  line <- lines[i]
  parsed_line <- tryCatch({
    fromJSON(line)
  }, error = function(e) {
    warning(paste("Line", i, "failed to parse:", e$message))
    NULL  # returning NULL for failed parses
  })
  return(parsed_line)
})

parsed <- Filter(Negate(is.null), parsed)
is_trial <- function(x) "trial_number" %in% names(x)
parsed_trials <- parsed[sapply(parsed, is_trial)]   # trials
parsed_meta   <- parsed[!sapply(parsed, is_trial)]  # non trials ie questionnaire data

# define the required fields for trials
required_fields <- c(
  "participant_id", 
  "trial_number", 
  "balloon_color", 
  "inflations", 
  "optimal_inflations", 
  "popped", 
  "points_earned", 
  "inactivity_pop", 
  "total_points_so_far", 
  "average_inflation_rt", 
  "inflation_rts"
)

df_trials <- bind_rows(lapply(seq_along(parsed_trials), function(i) {
  x <- parsed_trials[[i]]
  
  trial_data <- setNames(as.list(rep(NA, length(required_fields))), required_fields)
  
  # populate trial_data with available fields from x
  for(field in names(x)){
    if(field == "inflation_rts"){
      trial_data[[field]] <- list(x[[field]])
    } else if(field == "average_inflation_rt"){
      # Convert to numeric, assign NA if NULL or not numeric
      trial_data[[field]] <- if(!is.null(x[[field]])) as.numeric(x[[field]]) else NA_real_
    } else {
      trial_data[[field]] <- x[[field]]
    }
  }
  
  # converting the list to a tibble 
  as_tibble(trial_data)
}))

df_meta <- bind_rows(lapply(parsed_meta, function(x) {
  as_tibble(x)
}))

df_final <- left_join(df_trials, df_meta, by = "participant_id")
write_csv(df_final, "/Users/zachtefertiller/Desktop/balloon_task_all_data.csv")
glimpse(df_final)

# View(df_final)

json_file <- "/Users/zachtefertiller/Desktop/jatos_results_all.json"
lines <- readLines(json_file)
filtered_lines <- lines[!grepl('"prolific_id"', lines) & !grepl('trial_number', lines)]
filtered_json_file <- "/Users/zachtefertiller/Desktop/jatos_results_filtered.json"
writeLines(filtered_lines, filtered_json_file)
raw_text <- read_file(filtered_json_file)  
ndjson_text <- str_replace_all(raw_text, "\\}\\{", "\\}\n\\{")
write_file(ndjson_text, "/Users/zachtefertiller/Desktop/jatos_results_filtered.ndjson")  
df <- stream_in(file("/Users/zachtefertiller/Desktop/jatos_results_filtered.ndjson"))


df_spq_only <- df %>%
  filter(!map_lgl(spq_data, is.null)) %>%
  group_by(participant_id) %>%
  slice(1) %>%
  distinct(participant_id, spq_data) %>%
  ungroup()

df_spq <- df_spq_only %>%
  rowwise() %>%
  mutate(spq_diag = list(diag(as.matrix(spq_data)))) %>%
  ungroup() %>%
  unnest_wider(col = spq_diag, names_sep = "_") %>%
  rename_with(
    .cols = starts_with("spq_diag_"),
    .fn   = ~ paste0("spq_q", seq_along(.))
  )
  
df <- left_join(df, df_spq, by = "participant_id")
  
df_wide <-
  jsonlite::flatten(df) %>%
  group_by(participant_id) %>%
  summarise(
    across(
      everything(),
      ~ {
        non_na_vals <- .x[!is.na(.x) & .x != "NULL"]
        if (length(non_na_vals) == 0) {
          NA_character_
        } else {
          paste(unique(non_na_vals), collapse = ", ")
        }
      },
      .names = "{col}"
    )
  )

df_final <- left_join(df_final, df_wide, by = "participant_id")

## weird thing where ppgm columns showing up twice but these ones don't have any good data
df_final = subset(df_final, select = -c(ppgm1a,ppgm1b,ppgm2,ppgm3a,ppgm3b,ppgm4,ppgm5a,ppgm5b,ppgm6,
                                        ppgm7,ppgm8,ppgm9,ppgm10a,ppgm11,ppgm12,ppgm13,ppgm14, 
                                        timestamp_start, timestamp_end, start_timestamp, end_timestamp,
                                        spq_data.x,spq_data.y, event))

## have to expand mdq_q1, ppgm_q1, and spq_data from lists (mdq and ppgm just need one column, spq a column for each item)
df_final$mdq_q1 <- gsub("^c\\(|\\)$", "", df_final$mdq_q1)         
df_final$mdq_q1 <- gsub("\"", "", df_final$mdq_q1)
df_final$gambling_types <- gsub("^c\\(|\\)$", "", df_final$gambling_types)         
df_final$gambling_types <- gsub("\"", "", df_final$gambling_types)



## keeping trial data and id first etc, then alphabetizing the rest of the raw data
all_columns <- colnames(df_final)
alphabetized_cols <- setdiff(all_columns,required_fields)
alphabetized_cols <- sort(alphabetized_cols)
df_final <- df_final %>%
  select(all_of(required_fields), all_of(alphabetized_cols))



### saving all the raw data except the few nonsensical things we already filtered
write.csv(df_final %>% mutate(across(where(is.list), ~ sapply(., toString))), "/Users/zachtefertiller/Desktop/balloon_task_all_data.csv", row.names = FALSE)


### cleaning the data here so just trials and overall summary data are available
df_clean <- df_final %>% 
  dplyr::select(
    participant_id, trial_number, balloon_color, inflations, 
    optimal_inflations, popped, points_earned, inactivity_pop, 
    total_points_so_far, average_inflation_rt, inflation_rts, total_score, 
    total_pops, total_inactive, total_money, task_time, spq_total_score, 
    pdi_total, caps_total, phq_total, ipip_total_score, ppgm_total, mdq_total, antipsychotics, 
    family_bipolar, family_schizophrenia, drink_frequency, cigarettes_count, glasses_per_day)
                                


### saving the data in a nice easy summary csv with trials and most important data                  
write.csv(df_clean %>% mutate(across(where(is.list), ~ sapply(., toString))), "/Users/zachtefertiller/Desktop/balloon_task_clean_data.csv", row.names = FALSE)



