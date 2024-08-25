import json
import csv
import os
import pandas as pd


def participant_data(participant_folder):
    data = {}
    question_data = {}
    for root, dirs, files in os.walk(participant_folder):
        for file in files:
            if file.endswith('.txt') or file.endswith('.json'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r') as f:
                    file_content = f.read()
                    
                    try:
                        json_objects = file_content.split('}{')
                        if len(json_objects) > 1:
                            json_objects = [json_objects[0] + '}', '{' + json_objects[1]]
                        else:
                            json_objects = [file_content]
                    
                        for json_str in json_objects:
                            item = json.loads(json_str)
                            
                            if isinstance(item, dict):
                                if "questionNumber" in item:
                                    question_data['Q' + str(item['questionNumber'])] = item['answer']
                                else:
                                    for key, value in item.items():
                                        if isinstance(value, list):
                                            if key not in data:
                                                data[key] = []
                                            data[key].extend(value)
                                        else:
                                            if key not in data:
                                                data[key] = []
                                            data[key].append(value)
                            elif isinstance(item, list):
                                for sub_item in item:
                                    if isinstance(sub_item, dict):
                                        if "questionNumber" in sub_item:
                                            question_data['Q' + str(sub_item['questionNumber'])] = sub_item['answer']
                                        else:
                                            for key, value in sub_item.items():
                                                if key not in data:
                                                    data[key] = []
                                                data[key].append(value)
                    except json.JSONDecodeError:
                        print(f"Failed to decode JSON in file: {file_path}")
    
    # Add question data to each row
    max_len = max(len(v) for v in data.values())
    for key, value in question_data.items():
        data[key] = [value] * max_len
    
    return data

def clean_data(f):

    dictionary = participant_data(f)

    # Normalize the data to create a DataFrame
    normalized_data = []

    # Determine the length of lists in the dictionary
    max_len = max(len(v) for v in dictionary.values())

    for i in range(max_len):
        row = {}
        for key, value in dictionary.items():
            if isinstance(value, list):
               row[key] = value[i] if i < len(value) else None
            else:
                row[key] = value
        normalized_data.append(row)

    df = pd.DataFrame(normalized_data)
    
    droplist= ['agreedToTerms', 'timestamp', 'firstName', 'surname',
                'continueSession', 'distractionDescription', 'explosions', 
                'perfectGame', 'subject_id', 'startTime', 'endTime']
    for x in droplist:
        if x in df:
            df = df.drop(x, axis=1)
    
    df = df.ffill()
    
    new_order = ['participantID', 'totalPoints', 'balloonNumber', 'balloonColors', 'balloonInflations', 'optimalInflations', 'pointsPerBalloon', 
               'pointsOverTime','explosionYesNo', 'explosionsOverTime', 'gender', 'birthdate',
              'tobaccoProducts', 'cigarettesPerDay', 'alcohol', 'alcoholUnits', 'marijuana',
              'medications', 'timeToComplete', 'Q1', 'Q2', 'Q3','Q4','Q5','Q6','Q7','Q8','Q9',
              'Q10','Q11','Q12','Q13','Q14','Q15','Q16','Q17','Q18','Q19','Q20','Q21','Q22','Q23','Q24','Q25','Q26',
              'Q27','Q28','Q29', 'hadDistractions']

    df = df.reindex(columns=new_order)
    df = df.fillna(0)
    df['totalPoints'] = df['totalPoints'].astype(int)
    df['timeToComplete'] = round(df['timeToComplete']/1000/60).astype(int)


    print(df)
    return df


def main():
    root_folder = '/Users/zachtefertiller/Desktop/jatos_results_data_20240818234537'
    # root_folder = '/Users/zachtefertiller/Desktop/jatos_results_data_20240818234537/study_result_95'
    combined_data = pd.DataFrame(columns=['participantID', 'totalPoints', 'balloonNumber', 'balloonColors', 'balloonInflations', 'optimalInflations', 'pointsPerBalloon', 
               'pointsOverTime','explosionYesNo', 'explosionsOverTime', 'gender', 'birthdate',
              'tobaccoProducts', 'cigarettesPerDay', 'alcohol', 'alcoholUnits', 'marijuana',
              'medications', 'timeToComplete', 'Q1', 'Q2', 'Q3','Q4','Q5','Q6','Q7','Q8','Q9',
              'Q10','Q11','Q12','Q13','Q14','Q15','Q16','Q17','Q18','Q19','Q20','Q21','Q22','Q23','Q24','Q25','Q26',
              'Q27','Q28','Q29', 'hadDistractions'])
    for folder_name in os.listdir(root_folder):
        folder_path = os.path.join(root_folder, folder_name)
        # Check if it's a directory
        if os.path.isdir(folder_path):
            df = clean_data(folder_path)
            combined_data = pd.concat([combined_data, df], ignore_index=True)
    #     data = clean_data(participant_folder)
    #     combined_data = pd.concat([combined_data] + data)
        
    return combined_data.to_csv('allData.csv', index=False)

if __name__ == "__main__":
    main()
    
    
