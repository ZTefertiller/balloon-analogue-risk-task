## we cleaned the data but lets exclude participants who had technical issues ie not enough trials
library(jsonlite)
library(dplyr)
library(readr)
library(stringr)
library(tibble)

df <- read.csv("/Users/zachtefertiller/Desktop/balloon_task_clean_data.csv", header=TRUE, sep=",", stringsAsFactors=FALSE)

df %>%
  group_by(participant_id) %>%
  summarise(num_trials = n_distinct(trial_number)) %>%
  arrange(num_trials)


df_filtered <- df %>%
  group_by(participant_id) %>%
  filter(
    n_distinct(trial_number) == 180,                      # Check for 180 unique trials
    all(sort(unique(trial_number)) == 1:180)              # Ensure trials are exactly 1 to 180
  ) %>%
  ungroup()             





# Count the number of unique trials per participant
trial_counts <- df %>%
  group_by(participant_id) %>%
  summarise(num_trials = n_distinct(trial_number)) %>%
  arrange(num_trials)

# View the trial counts
print(trial_counts)


df_filtered <- df %>%
  group_by(participant_id) %>%
  filter(
    n_distinct(trial_number) == 180,                     # Check for 180 unique trials
    all(sort(unique(trial_number)) == 1:180)             # Ensure trials are exactly 1 to 180
  ) %>%
  ungroup()


complete_participants <- trial_counts %>%
  filter(num_trials == 180) %>%
  pull(participant_id)

df_filtered <- df %>%
  filter(participant_id %in% complete_participants)

## remove rows without a trial number or participant_id value
df_clean <- df_filtered %>%
  filter(
    !is.na(participant_id),
    !is.na(trial_number)
  )

remaining_duplicates <- df_clean %>%
  group_by(participant_id, trial_number) %>%
  filter(n() > 1) %>%
  ungroup()

if(nrow(remaining_duplicates) > 0){
  cat("There are still duplicate trials:\n")
  print(remaining_duplicates)
} else {
  cat("All duplicate trials have been successfully removed.\n")
}


duplicate_trials <- df_clean %>%
  group_by(participant_id, trial_number) %>%
  filter(n() > 1) %>%
  arrange(participant_id, trial_number) %>%
  ungroup()

# Check if any duplicates exist
if(nrow(duplicate_trials) > 0){
  cat("Duplicate trials found:\n")
  print(duplicate_trials)
} else {
  cat("No duplicate trials found.\n")
}

# Remove duplicate trials, keeping only the first occurrence
df_clean_unique <- df_clean %>%
  distinct(participant_id, trial_number, .keep_all = TRUE)


df_clean_unique <- df_clean %>%
  group_by(participant_id, trial_number) %>%
  slice(1) %>%  # Keeps the first occurrence in each group
  ungroup()


write.csv(df_clean_unique %>% mutate(across(where(is.list), ~ sapply(., toString))), "/Users/zachtefertiller/Desktop/balloon_task_clean_data.csv", row.names = FALSE)



## or down here more strict if we need to remove the people that had duplicate trials.




