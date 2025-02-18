library(dplyr)
library(cmdstanr)
library(bayesplot)
library(shinystan)

dataset <- read.csv("/Users/zachtefertiller/Desktop/balloon_task_clean_data.csv", header=TRUE, sep=",", stringsAsFactors=FALSE)

# setup dataframe for reversal
df <- dataset %>%
     mutate(color_max = case_when(
        balloon_color == 'y' ~ 36,
        balloon_color == 'o' & trial_number > 91 ~ 128,
        balloon_color == 'o' & trial_number < 91 ~ 8,
        balloon_color == 'b' & trial_number < 91 ~ 128,
        balloon_color == 'b' & trial_number >= 91 ~ 8,
))

df_spq <- df %>%
  group_by(participant_id) %>%
  summarise(spq_total = first(spq_total_score))

df_spq <- df_spq %>%
  mutate(spq_z = as.vector(scale(spq_total, center = TRUE, scale = TRUE)))

df <- df %>% 
  left_join(df_spq, by = "participant_id")


participant_id_of_interest <- "AB10CALL"
participant_ids <- c("AB10CALL", "AB10LYOK", "AR11BEKE","AT11KEMI",
                     "AU02RADE","AU03PAER","BE01ANMC","BE05ANRD")

# limited to a few people, only blue balloons starting
df_subset <- df %>% 
  filter(participant_id %in% participant_ids,  balloon_color == "b")

#  single trial   participant_id == participant_id_of_interest & 

df_one <- df_subset %>% filter(balloon_color == "b")
spq_subset <- df_spq %>% 
  filter(participant_id %in% participant_ids) %>% 
  # Arrange them in the same order as in participant_ids (optional but helps avoid indexing issues)
  arrange(match(participant_id, participant_ids))

# Now define the number of subjects and trials for this subset
nsub <- 8
ntrial <- nrow(df_one)  # This should be the number of trials for that participant (e.g., 180)
# Create the matrices for Stan:
outcome   <- matrix(df_one$popped, nrow = nsub, ncol = ntrial, byrow = TRUE)
npumps    <- matrix(df_one$inflations, nrow = nsub, ncol = ntrial, byrow = TRUE)
color_max <- matrix(df_one$color_max, nrow = nsub, ncol = ntrial, byrow = TRUE)

# If your model uses an 'opportunity' variable, compute it as well:
opportunity <- npumps + (1 - outcome)

# Construct the d array as needed (example below uses a placeholder value)
# Here, we assume the maximum pump opportunity is the max of color_max (or a fixed number if preferred)
n.maxpump <- max(color_max)
d <- array(88, dim = c(nsub, ntrial, n.maxpump))
for (i in 1:nsub) {
  for (j in 1:ntrial) {
    pumps <- npumps[i, j]
    out <- outcome[i, j]
    if (pumps > 0) {
      d[i, j, 1:pumps] <- rep(1, pumps)
    }
    if (out == 0) {
      d[i, j, pumps + 1] <- 0
    }
  }
}

# Prepare the Stan data list:
stan_data <- list(
  nsub = nsub,               # 1 subject now
  ntrial = ntrial,           # number of trials for this participant
  outcome = outcome,         # outcome matrix
  npumps = npumps,           # number of pumps matrix
  color_max = color_max,     # trial-specific maximum (for internal use if needed)
  opportunity = opportunity, # computed number of pump opportunities
  maxpump = n.maxpump,       # overall maximum pump value for array dimensions
  spq = df_spq$spq_z,        # a vector of centered/scaled SPQ scores
  d = d                      # your decision array
)



mod <- cmdstan_model("/Users/zachtefertiller/Desktop/STL_toy/STL_HBM_SPQ_and_color.stan")

fit <- mod$sample(
  data = stan_data,
  iter_sampling = 500,
  iter_warmup = 500,
  chains = 2,
  parallel_chains = 8, 
  output_dir = "/Volumes/Transcend/mcmcstl"
)



ss <- as.shinystan(draws)
launch_shinystan(ss)

draws <- fit$draws()
print(draws)

fit_summary <- fit$summary()
print(fit_summary)

launch_shinystan(as.shinystan(fit))



csv_files <- list.files("/Volumes/Transcend/mcmcstl", full.names = TRUE, pattern = ".csv$")
fit <- read_cmdstan_csv(csv_files)

