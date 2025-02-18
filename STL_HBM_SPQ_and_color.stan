// The Scaled Target Learning Model
// Hierarchical model


data {
  int<lower=1> nsub;
  int<lower=1> ntrial;
  array[nsub, ntrial] int<lower=0, upper=1> outcome;
  array[nsub, ntrial] int<lower=0> npumps;
  array[nsub, ntrial] int<lower=1> opportunity;
  array[nsub, ntrial] int color_max;  // trial-specific maximum values
  int<lower=1> maxpump;  // overall maximum pump opportunity (e.g., 128)
  vector[nsub] spq;  // centered and scaled SPQ scores
  array[nsub, ntrial, maxpump] int d;
  // questionnaire predictors
}



parameters {
  // Group-level parameters
  real beta_spq;         // regression coefficient for SPQ
  real<lower=0> mu_vwin;
  real<lower=0> mu_vloss;
  real<lower=0,upper=1> mu_omegaone;
  real<lower=0> mu_beta;
  vector<lower=0.00001>[4] sigma;
  
  real beta_vwin_spq;    // SPQ effect on win sensitivity (vwin)
  real beta_vloss_spq;   // SPQ effect on loss sensitivity (vloss)
  real beta_beta_spq;    // SPQ effect on beta (decision sensitivity)

  vector<lower=0,upper=1>[nsub] vwin;
  vector<lower=0,upper=1>[nsub] vloss;
  vector<lower=0,upper=1>[nsub] omegaone;
  vector<lower=0,upper=3>[nsub] beta;
}

model {
  //priors
  mu_vwin  ~ normal(0, 1);
  mu_vloss  ~ normal(0, 1);
  mu_omegaone  ~ normal(0, 1);
  mu_beta  ~ normal(0, 1);
  sigma ~ inv_gamma(1, 1);
  beta_vwin_spq  ~ normal(0, 1);
  beta_vloss_spq ~ normal(0, 1);
  beta_beta_spq  ~ normal(0, 1);
  
  //likelihood
  for (i in 1:nsub) {
    vector[ntrial] omega;

    // Subject-level parameters predicted by group intercepts and SPQ
    vwin[i]    ~ normal(mu_vwin  + beta_vwin_spq  * spq[i], sigma[1]);
    vloss[i]   ~ normal(mu_vloss + beta_vloss_spq * spq[i], sigma[2]);
    omegaone[i] ~ normal(mu_omegaone, sigma[3]); // no SPQ effect here (can add if desired)
    beta[i]    ~ normal(mu_beta  + beta_beta_spq  * spq[i], sigma[4]);

    for (k in 1:ntrial) {

      if (k < 2){
        omega[k] = color_max[i, k] * omegaone[i];
      }

      else{
        if (outcome[i, k-1] == 1) {
          omega[k] = color_max[i, k] * ((omega[k-1] / color_max[i, k]) * 
                    (1 - (vloss[i] * (1 - (npumps[i, k-1] * 1.0 / color_max[i, k])))));
        } else {
          omega[k] = color_max[i, k] * ((omega[k-1] / color_max[i, k]) * 
                    (1 + (vwin[i] * (npumps[i, k-1] * 1.0 / color_max[i, k]))));
        }
      }

      for (n in 1:opportunity[i,k]) {
        d[i,k,n] ~ bernoulli_logit(-beta[i] * (n - omega[k]));
      }
    }
  }
}

generated quantities {
  // Log-likelihood for model fit
  array[nsub] real log_lik;

  // For posterior predictive check: allocate with fixed dimension maxpump
  array[nsub, ntrial, maxpump] real y_pred;

  // Initialize y_pred with a placeholder
  for (i in 1:nsub)
    for (k in 1:ntrial)
      for (l in 1:maxpump)
        y_pred[i, k, l] = -1;

  { // Local section 
    for (i in 1:nsub) {
      vector[ntrial] omega;
      log_lik[i] = 0;
      for (k in 1:ntrial) {
        if (k < 2) {
          omega[k] = color_max[i, k] * omegaone[i];
        } else {
          if (outcome[i, k-1] == 1) {
            omega[k] = color_max[i, k] * ((omega[k-1] / color_max[i, k]) *
                        (1 - (vloss[i] * (1 - (npumps[i, k-1] * 1.0 / color_max[i, k])))));
          } else {
            omega[k] = color_max[i, k] * ((omega[k-1] / color_max[i, k]) *
                        (1 + (vwin[i] * (npumps[i, k-1] * 1.0 / color_max[i, k]))));
          }

        }
        for (n in 1:opportunity[i, k]) {
          log_lik[i] += bernoulli_logit_lpmf(d[i, k, n] | -beta[i] * (n - omega[k]));
        }
        for (l in 1:color_max[i, k]) {
          y_pred[i, k, l] = bernoulli_logit_rng(-beta[i] * (l - omega[k]));
        }
      }
    }
  }
}
