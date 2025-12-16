using UnityEngine;  // ←←← это было забыто! Теперь IEnumerator работает
using System.Collections;  // для IEnumerator и StartCoroutine
using Firebase;
using Firebase.Database;
using System.Threading.Tasks;
using System;

public class FirebaseTest : MonoBehaviour
{
    private DatabaseReference dbRef;

    private async void Start()
    {
        Debug.Log("Тест Firebase: начинаем проверку зависимостей...");

        var dependencyStatus = await FirebaseApp.CheckAndFixDependenciesAsync();

        if (dependencyStatus == DependencyStatus.Available)
        {
            Debug.Log("Firebase зависимости ОК — подключено!");

            FirebaseApp.DefaultInstance.Options.DatabaseUrl = 
                new Uri("https://booking-ee47f-default-rtdb.europe-west1.firebasedatabase.app");

            dbRef = FirebaseDatabase.DefaultInstance.RootReference;

            Debug.Log("Готов читать данные из базы");

            // Запускаем повторное чтение timestamp
            StartCoroutine(ReadTimestampRepeatedly());
        }
        else
        {
            Debug.LogError("Ошибка Firebase зависимостей: " + dependencyStatus);
        }
    }

    private IEnumerator ReadTimestampRepeatedly()
    {
        while (true)
        {
            DatabaseReference timestampRef = dbRef.Child("devices").Child("Pod_01_entrada_01").Child("timestamp");

            var task = timestampRef.GetValueAsync();

            yield return new WaitUntil(() => task.IsCompleted);

            if (task.IsFaulted)
            {
                Debug.LogError("Ошибка чтения timestamp: " + task.Exception);
            }
            else if (task.Result.Value != null)
            {
                long timestamp = (long)task.Result.Value;
                Debug.Log("Успешно прочитано! timestamp = " + timestamp);
            }
            else
            {
                Debug.Log("timestamp = null (нет значения в базе)");
            }

            yield return new WaitForSeconds(2f);  // ждём 2 секунды и снова
        }
    }
}
