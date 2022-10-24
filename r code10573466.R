# install packages
install.packages('forcats')
install.packages("dplyr")
install.packages("glmnet")
install.packages("naniar")
install.packages("caret")
install.packages("tidyverse")
install.packages('caTools')
install.packages("rpart.plot")
install.packages("ipred")
install.packages("randomForest")
install.packages("mlbench")

# import library
library(forcats)
library(dplyr) 
library(tidyverse) 
library(naniar)
library(glmnet)
library(caret)
library(caTools)
library(rpart)
library(rpart.plot)
library(ipred)  
library(randomForest)
library(mlbench)


# reading/loading dataset

data <- read.csv("C:\Users\Disna\OneDrive\Desktop\Bioinformatic\MAT6206.2\Assignment2\ML_dataset2 (1).csv")
print(head(data,5))

# printing number of rows and columns
print(ncol(data))
print(nrow(data))

print("dimension of dataset:")
print(dim(data))

# check null values
print(is.null(data))

# printing sum of null values
print(colSums(is.na(data)))

cat("satistical report of data","\n",summary(data))

# list the structure of mydata
table(str(data))

# creating a copy of data into data_copy
data_copy1 <- data 

# printing first fives rows
print(head(data_copy1,5))

# dimensions of the dataset
print(dim(data_copy1))

# dropping Sample.ID column
data_copy1 <- subset(data_copy1, select = -c(Sample.ID))

# dimensions of the dataset after dropping
print(dim(data_copy1))

cat("\n")

print("printing unique values in each col")

unique(data_copy1$Protocol)

unique(data_copy1$Target.Honeypot.Server.OS)

unique(data_copy1$Source.OS.Detected)

unique(data_copy1$Source.Port.Range)

unique(data_copy1$Source.IP.Type.Detected)

unique(data_copy1$APT)


# creating another copy of the dataset

data_copy2 <- data_copy1

# combine/merge its Source.OS.Detected  category using fct_collapse

fct_count(data_copy2$Source.OS.Detected) # initial count of values

data_copy2$Source.OS.Detected<- fct_collapse(data_copy2$Source.OS.Detected,
                                             Windows_All = c("Windows 10", "Windows Server 2008"))
fct_count(data_copy2$Source.OS.Detected) # final count of values 



# combine/merge its Target.Honeypot.Server.OS  category using fct_collapse

fct_count(data_copy2$Target.Honeypot.Server.OS) # initial count of values 

data_copy2$Target.Honeypot.Server.OS <- fct_collapse(data_copy2$Target.Honeypot.Server.OS,
                                                     Windows_DeskServ = c("Windows (Desktops)", "Windows (Servers)"),
                                                     MacOS_Linus = c("Linux", "MacOS (All)"))

fct_count(data_copy2$Target.Honeypot.Server.OS) # final count of values

# As there are more number of missing values in the IP.Range.Trust.Score,Source.Port.Range removeing that columns 

data_copy2 <- subset(data_copy2, select = -c(IP.Range.Trust.Score,Source.Port.Range))


# replacing ??? value with NA in Source.OS.Detected

# count of each valaue in Source.OS.Detected
fct_count(data_copy2$Source.OS.Detected)

## replacing the ??? with NA
levels(data_copy2$Source.OS.Detected)[levels(data_copy2$Source.OS.Detected)=="???"] <- NA

# replacing the NA value with mode values of Source.OS.Detected column
val <- unique(data_copy2$Source.OS.Detected[!is.na(data_copy2$Source.OS.Detected)])                   # Values in vec_miss
my_mode <- val[which.max(tabulate(match(data_copy2$Source.OS.Detected, val)))] 

data_copy2$Source.OS.Detected[is.na(data_copy2$Source.OS.Detected)] <- my_mode 

fct_count(data_copy2$Source.OS.Detected) # final count of the values 

# check if the NA values are present or not in PORT column
print(sum(is.na(data_copy2$Port)))

# replacing the NA value with mode values of Port column
val <- unique(data_copy2$Port[!is.na(data_copy2$Port)]) 
my_mode <- val[which.max(tabulate(match(data_copy2$Port, val)))] 

data_copy2$Port[is.na(data_copy2$Port)] <- my_mode 

print(sum(is.na(data_copy2$Port)))

# replacing the 99999 with NA

# checking whether the value is actually present in column or not
print(99999 %in% data_copy2$Average.ping.to.attacking.IP.milliseconds)

print(sum(is.na(data_copy2$Average.ping.to.attacking.IP.milliseconds)))# checking null values

options(max.print = .Machine$integer.max)

# replacing 99999 with NA
data_copy2$Average.ping.to.attacking.IP.milliseconds[data_copy2$Average.ping.to.attacking.IP.milliseconds == 99999] <- NA

# rechecking the if the value is still present or not and also checking null count
print(sum(is.na(data_copy2$Average.ping.to.attacking.IP.milliseconds)))

print(99999 %in% data_copy2$Average.ping.to.attacking.IP.milliseconds)


# replacing the -1 with NA

# options(max.print = .Machine$integer.max)

# checking whether the value -1 present in column or not

print(-1 %in% data_copy2$Attack.Source.IP.Address.Count)

# checking null value count 
print(sum(is.na(data_copy2$Attack.Source.IP.Address.Count)))

options(max.print = .Machine$integer.max)


# replacing with NA
data_copy2$Attack.Source.IP.Address.Count[data_copy2$Attack.Source.IP.Address.Count == -1 ] <- NA

print(sum(is.na(data_copy2$Attack.Source.IP.Address.Count)))


# applying log transfrom Average.ping.variability column
data_copy2$Average.ping.variability=log(data_copy2$Average.ping.variability)

# applying sqrt transfrom 

data_copy2$Hits <- sqrt(data_copy2$Hits)  

data_copy2$Attack.Source.IP.Address.Count <- sqrt(data_copy2$Attack.Source.IP.Address.Count)   

data_copy2$Average.ping.to.attacking.IP.milliseconds <- sqrt(data_copy2$Average.ping.to.attacking.IP.milliseconds)   

data_copy2$Individual.URLs.requested <- sqrt(data_copy2$Individual.URLs.requested )   


# new dataframe with omitting null values
data_copy2 = na.omit(data_copy2)

# checking null count 
print(sum(is.na(data_copy2)))

# creating a copy and saving it as ML_dataset_cleaned which is a clean dataset
ML_dataset_cleaned <- data_copy2

print(dim(ML_dataset_cleaned))

write.csv(ML_dataset_cleaned,"D:\\internship_data\\Deadline- Sai Ambica 06 May, PARVATHIE MUNIANDY _parvathiemuniandy@gmail.com_\\ML_dataset_cleaned.csv", row.names = FALSE)

print(unique(ML_dataset_cleaned$Protocol))

print(unique(ML_dataset_cleaned$Target.Honeypot.Server.OS))

print(unique(ML_dataset_cleaned$Source.OS.Detected))

print(unique(ML_dataset_cleaned$Source.IP.Type.Detected))


# encoding the categorical value in the dataset  
encode_ordinal <- function(x, order = unique(x)) {
  x <- as.numeric(factor(x, levels = order, exclude = NULL))
  x
}

ML_dataset_cleaned[["Protocol_encoded"]] <- encode_ordinal(ML_dataset_cleaned[["Protocol"]])
print(unique(ML_dataset_cleaned$Protocol_encoded))

ML_dataset_cleaned[["Target.OS_encoded"]] <- encode_ordinal(ML_dataset_cleaned[["Target.Honeypot.Server.OS"]])
print(unique(ML_dataset_cleaned$Target.OS_encoded))

ML_dataset_cleaned[["Source.OS_encoded"]] <- encode_ordinal(ML_dataset_cleaned[["Source.OS.Detected"]])
print(unique(ML_dataset_cleaned$Source.OS_encoded))

ML_dataset_cleaned[["Source.IP_encoded"]] <- encode_ordinal(ML_dataset_cleaned[["Source.IP.Type.Detected"]])
print(unique(ML_dataset_cleaned$Source.IP_encoded))


# now dropping the encoded columns
ML_dataset_cleaned2 <- subset(ML_dataset_cleaned, select = -c(Protocol,Target.Honeypot.Server.OS,Source.OS.Detected,Source.IP.Type.Detected))

# printing the three different models to be executed 

set.seed(10573466)
models.list1 <- c("Logistic Ridge Regression",
                  "Logistic LASSO Regression",
                  "Logistic Elastic-Net Regression")
models.list2 <- c("Classification Tree",
                  "Bagging Tree",
                  "Random Forest")
myModels <- c("Binary Logistic Regression",
              sample(models.list1,size=1),
              sample(models.list2,size=1))
myModels %>% data.frame

#since we got ,Binary Logistic Regression, LogisticElastic-Net Regression,Classification Tree we are implimenting our model using this three models

# splitting the dataset into the training set and test set

split = sample.split(ML_dataset_cleaned2$APT,SplitRatio = 0.3)

training_set = subset(ML_dataset_cleaned2,split == TRUE)
test_set = subset(ML_dataset_cleaned2,split == FALSE)

print(dim(training_set))
print(dim(test_set))

# saving the training and testing sets
write.csv(training_set,"train_data.csv")
write.csv(test_set,"test_data.csv")

# Dumy code categorical predictor variables
x <- model.matrix(APT~., training_set)[,-1]
print(dim(x))
# Convert the outcome (class) to a numerical variable
y <- ifelse(training_set$APT == "Yes", 1, 0)

set.seed(10573466)
log.model <- glmnet(x,y,alpha = 0.3,family = "binomial")

# summary of the fitted model
summary(log.model)

# Make predictions on the test data
x.test <- model.matrix(APT ~., test_set)[,-1]
print(dim(x.test))
probabilities <- log.model %>% predict(newx = x.test)
predicted.classes <- ifelse(probabilities > 0.5, "Yes", "No")
# Model accuracy
observed.classes <- test_set$APT
cat("Logistic elastic Regression accuracy",mean(predicted.classes == observed.classes))

#hypertunning for Logistic elastic Regression 

cv_5 = trainControl(method = "cv", number = 5)

def_elnet1 = train(
  APT ~ ., data = training_set,
  method = "glmnet",
  trControl = cv_5
)
def_elnet1


get_best_result = function(caret_fit) {
  best = which(rownames(caret_fit$results) == rownames(caret_fit$bestTune))
  best_result = caret_fit$results[best, ]
  rownames(best_result) = NULL
  best_result
}



def_elnet_int = train(
  APT ~ ., data = training_set,
  method = "glmnet",
  trControl = cv_5,
  tuneLength = 10
)

print("best hyper tuning parameters")
get_best_result(def_elnet_int)


# Model tunning
set.seed(10573466)
Elastic_reg <- glmnet(x,y,alpha = 0.5,lambda = 0.1452837 ,family = "binomial")
# summary of the fitted model
summary(Elastic_reg)

# Make predictions on the test data
x_test <- model.matrix(APT ~., test_set)[,-1]
print(dim(x_test))
probabilities1 <- Elastic_reg %>% predict(newx = x_test)
predicted.classes1 <- ifelse(probabilities1 > 0.5, "Yes", "No")

observed.classes <- test_set$APT

conf_matrix_reg<-table(predicted.classes1,observed.classes)
conf_matrix_reg

sensitivity(conf_matrix_reg)

specificity(conf_matrix_reg)

# Model accuracy

cat("accutacy of Hyper-perameter Logistic elastic Regression model",mean(predicted.classes1 == observed.classes))

# confusion matrix with Initial.Modelling.Result
test_set$Initial.Modelling.Result[test_set$Initial.Modelling.Result =="Correctly identified as not APT"] = "No"
test_set$Initial.Modelling.Result[test_set$Initial.Modelling.Result =="Correctly identified as APT"] = "Yes"
test_set$Initial.Modelling.Result[test_set$Initial.Modelling.Result =="Incorrectly identified as APT"] = "No"
test_set$Initial.Modelling.Result[test_set$Initial.Modelling.Result =="Incorrectly identified as not APT"] = "No"

observed.classes_2 <- test_set$Initial.Modelling.Result

conf_matrix_2<-table(predicted.classes1,observed.classes_2)
conf_matrix_2

cat("sensitivity",sensitivity(conf_matrix_2))

cat("specificity",specificity(conf_matrix_2))

# Model accuracy

cat("Logistic Ridge Regression model on Initial.Modelling.Result",mean(predicted.classes1 == observed.classes_2))




#building the classification tree


training_set1 <-training_set
test_set1 <-test_set

training_set1 <- subset(training_set1, select = -c(Initial.Modelling.Result))
test_set1 <- subset(test_set1, select = -c(Initial.Modelling.Result))


tree_model <- rpart(APT~., data = training_set1, method = 'class')

summary(tree_model)

rpart.plot(tree_model,extra = 4)

plotcp(tree_model)

tree_predict <-predict(tree_model, test_set1, type = 'class')

table_mat <- table(test_set1$APT, tree_predict)
table_mat

accuracy_Test <- sum(diag(table_mat)) / sum(table_mat)
print(paste('Accuracy for test', accuracy_Test))

# hyper tuning Classification tree

# Creating the train and test masks

library(mlr)

triantask <- makeClassifTask(data = training_set1, target = "APT")
testtask <- makeClassifTask(data = test_set1,target = "APT")


tree <- makeLearner("classif.rpart")

# Defining the hyperparameter space for tuning
set.seed(10573466)
treeParamSpace <- makeParamSet(
  makeIntegerParam("minsplit", lower = 2, upper = 10),
  makeIntegerParam("minbucket", lower = 1, upper = 5),
  makeNumericParam("cp", lower = 0.01, upper = 0.1),
  makeIntegerParam("maxdepth", lower = 3, upper = 7))

# Defining the random search
randSearch <- makeTuneControlRandom(maxit = 200)
cvForTuning <- makeResampleDesc("CV", iters = 5)

# Performing hyperparameter tuning
#set parallel backend (Windows)
library(parallelMap)
library(parallel)
parallelStartSocket(cpus = detectCores())

tunedTreePars <- tuneParams(tree, task = triantask,
                            resampling = cvForTuning,
                            par.set = treeParamSpace,
                            control = randSearch)

parallelStop()

# printing the tunned parameter
print("hyper tuning parameter for Classification tree")

tunedTreePars

# Training the final tuned model
tunedTree <- setHyperPars(tree, par.vals = tunedTreePars$x)
tunedTreeModel <- train(tunedTree, triantask)

# Plotting the decision tree
treeModelData <- getLearnerModel(tunedTreeModel)
rpart.plot(treeModelData, roundint = FALSE,
           box.palette = "BuBn",
           extra = 4)

# building model with obtained parameters


control <- rpart.control(minsplit = 5,
                         minbucket = 2,
                         maxdepth = 6,
                         cp = 0.011)
set.seed(10573466)
tune_fit_2 <- rpart(APT~., data = training_set1, method = 'class', control = control)

predict_unseen_2 <- predict(tune_fit_2, test_set1, type = 'class')
table_mat_2 <- table(test_set$APT, predict_unseen_2)
table_mat_2
accuracy_Test_2 <- sum(diag(table_mat_2)) / sum(table_mat_2)
cat("Classification tree model accuracy",accuracy_Test_2)


conf_matrix_3<-table(predict_unseen_2,observed.classes_2)
conf_matrix_3

cat("sensitivity",sensitivity(conf_matrix_3))

cat("specificity",specificity(conf_matrix_3))

# Model accuracy

cat(" accuracy on Classification tree model for Initial.Modelling.Result",mean(predict_unseen_2 == observed.classes_2))


#Binary Logistic Regression model

# Training the model
set.seed(10573466)
#options(max.print = .Machine$integer.max)


training_set2 <-training_set
test_set2 <-test_set

training_set2$APT = as.factor(training_set2$APT)
test_set2$APT = as.factor(test_set2$APT)

training_set2 <- subset(training_set2, select = -c(Initial.Modelling.Result))
test_set2 <- subset(test_set2, select = -c(Initial.Modelling.Result))


logistic_model <- glm(APT ~ ., family = binomial(), training_set2)
# Checking the model
summary(logistic_model)

# Predicting in the test data set

pred_prob <- predict(logistic_model, test_set2, type = "response")

# Converting from probability to actual output
pred_prob <- ifelse(pred_prob >= 0.5, "Yes", "No")
table_mat1 <- table(test_set2$APT, pred_prob)
print(table_mat1)

# Accuracy in Test dataset

accuracy_test <- sum(diag(table_mat1))/sum(table_mat1)*100
cat("Binary Logistic Regression model",accuracy_test)

# confusion matrix on Initial.Modelling.Result

conf_matrix_4<-table(pred_prob,observed.classes_2)
conf_matrix_4

cat("sensitivity",sensitivity(conf_matrix_4))

cat("specificity",specificity(conf_matrix_4))

# Model accuracy on Initial.Modelling.Result

cat("Binary Logistic Regression model on Initial.Modelling.Result",mean(pred_prob == observed.classes_2))



