# The Elo Conversion Equation Used in TTS Evaluation

## The Core Equation

The paper fits Bradley-Terry by maximum likelihood to get latent strength scores β, then maps them to an Elo-like scale. The standard equation is:

$$\text{Elo}_i = 1000 + \frac{400}{\ln(10)} \cdot \beta_i$$

Where:

- **1000** = anchor point (the conventional center of the scale)
- **400/ln(10) ≈ 173.7** = scaling constant from Arpad Elo's original chess system
- **β_i** = the Bradley-Terry log-strength of model *i* from MLE

---

## Why This Specific Form

The Bradley-Terry win probability is:

$$P(i \text{ beats } j) = \frac{e^{\beta_i}}{e^{\beta_i} + e^{\beta_j}} = \frac{1}{1 + e^{-(\beta_i - \beta_j)}}$$

Elo expresses the same probability in base-10 with a 400-point scale:

$$P(i \text{ beats } j) = \frac{1}{1 + 10^{-(\text{Elo}_i - \text{Elo}_j)/400}}$$

For these two to be mathematically identical, you need:

$$\frac{\beta_i - \beta_j}{1} = \frac{\text{Elo}_i - \text{Elo}_j}{400/\ln(10)}$$

Which gives the conversion:

$$\text{Elo} = 1000 + \frac{400}{\ln(10)} \cdot \beta$$

The 400 and 1000 are pure conventions inherited from chess — they don't change the rankings, just the readability.

---

## Verifying With the Paper's Numbers

**Gemini 2.5 Pro** at Elo 1128.53 → β ≈ 0.74
**Indic F5** at Elo 805.75 → β ≈ −1.12

Predicted win probability of Gemini over Indic F5:

$$P = \frac{1}{1 + 10^{-(1128.53 - 805.75)/400}} = \frac{1}{1 + 10^{-0.807}} \approx 0.865$$

So the model predicts Gemini beats Indic F5 in ~86.5% of head-to-heads. The paper reports Gemini's overall win rate at 70% (across all opponents) and Indic F5's at 19% — consistent with this gap when you account for the other opponents in between.

---

## What MLE Actually Solves

Given pairwise outcomes, MLE finds the β vector that maximizes:

$$\mathcal{L}(\beta) = \prod_{(i,j) \in \text{wins}} \frac{e^{\beta_i}}{e^{\beta_i} + e^{\beta_j}}$$

Or equivalently, the log-likelihood:

$$\ell(\beta) = \sum_{(i,j)} \left[ \beta_i - \ln(e^{\beta_i} + e^{\beta_j}) \right]$$

Solved iteratively using **Hunter's MM algorithm** (cited as reference [29] in the paper). The β values are identified only up to an additive constant — that's why the +1000 anchor is needed; otherwise the absolute scores are arbitrary.

---

## Quick Reference: Elo Gap → Win Probability


| Elo Gap | Win Probability of Stronger Model |
| ------- | --------------------------------- |
| 0       | 50.0%                             |
| 50      | 57.1%                             |
| 100     | 64.0%                             |
| 200     | 75.9%                             |
| 300     | 84.9%                             |
| 400     | 90.9%                             |
| 500     | 94.7%                             |


**Rule of thumb**: Every 400 Elo points = 10:1 odds in favor of the stronger model.