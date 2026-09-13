# CTR Prediction

## Goal
1. To refresh on ML basics, including models & 5 metrics through running on real dataset
2. To differentiate between 5 metrics changes based on the different thresholds that's solely human chose and have nothing to do with the dataset

## Dataset
I randomly sampled 10k data, each one includes 5 dimensions (age, hist_ctr, ad_position, device, country) to predict the probability that they will click on one ad. 

## Models
Since the output is probabilty, I choose to use logistic regression for simplicity. 

## Evaluation
1. The auc-roc is about 0.67, which just slightly above a random guess 0.5 and far from 1. So it suggests this is not a good fit. 
2. As the threshold increased from 0.05 to 0.3, I see the precision keeps increasing which is also expected. As increasing threshold means that we are more cautious to say that one case is positive, thuse it's expected that it's more likely that the ones we mark as positive are true positive, thus precision should increase; However, precision dropped immediately to 0 after threshold reaches 0.4, this suggested that no positive sample is able to have scores greater than 0.4 thus all failed to be identified, this suggests that the score formula is not capturing the actual positive sample's pattern, which may due to positive sample proportion genuiely be small amoung the dataset, and it needs further investigation and improvement e.g. change to a more complex model or including more dimensions into the model, or increasing sample size can also be helpful.
3. As the threshold increases, recall rate dropped from 0.8+ to 0 which is also expected, because increasing threshold meaning we are more cautious in saying one sample is positive, thus we are more likely to miss the true positive ones. 


## Threshold Experiment
See above

## What I Learned
Roc-auc is more reliable, as it only depends on dataset and model performance, and not dependent on the human chosen threshold. 
The decision to adopt using precision, recall or F1 should depend on the real business needs and risks. But generally speaking, the precision increases and recall drops as the threshold increases. And if both precision and recall are important then we can use F1 scores to measure the different threshold performance and which to use. 


## Appendix: Test Result
ROC-AUC: 0.6691

Threshold = 0.05
------------------------------
Precision: 0.1039
Recall: 0.8238
F1: 0.1845
Accuracy: 0.4077

Threshold = 0.1
------------------------------
Precision: 0.142
Recall: 0.4918
F1: 0.2204
Accuracy: 0.717

Threshold = 0.15
------------------------------
Precision: 0.1939
Recall: 0.2623
F1: 0.223
Accuracy: 0.8513

Threshold = 0.2
------------------------------
Precision: 0.2308
Recall: 0.0984
F1: 0.1379
Accuracy: 0.9

Threshold = 0.3
------------------------------
Precision: 0.5
Recall: 0.0082
F1: 0.0161
Accuracy: 0.9187

Threshold = 0.4
------------------------------
Precision: 0.0
Recall: 0.0
F1: 0.0
Accuracy: 0.9187

Threshold = 0.5
------------------------------
Precision: 0.0
Recall: 0.0
F1: 0.0
Accuracy: 0.9187
