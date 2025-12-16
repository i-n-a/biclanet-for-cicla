using UnityEngine;
using Firebase;
using Firebase.Database;
using System.Threading.Tasks;
using System;

public class FirebaseManager : MonoBehaviour
{
    public static FirebaseManager Instance;
    public static bool IsReady = false;  // новый флаг

    private DatabaseReference dbReference;

    private async void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);

            Debug.Log("FirebaseManager создан — начинаем подключение");

            await InitializeFirebase();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private async Task InitializeFirebase()
    {
        var dependencyStatus = await FirebaseApp.CheckAndFixDependenciesAsync();

        if (dependencyStatus == DependencyStatus.Available)
        {
            Debug.Log("Firebase подключён успешно!");

            FirebaseApp.DefaultInstance.Options.DatabaseUrl = 
                new Uri("https://booking-ee47f-default-rtdb.europe-west1.firebasedatabase.app");

            dbReference = FirebaseDatabase.DefaultInstance.RootReference;

            IsReady = true;  // флаг готов
            Debug.Log("Firebase полностью готов (IsReady = true)");
        }
        else
        {
            Debug.LogError("Ошибка подключения Firebase: " + dependencyStatus);
        }
    }

    public DatabaseReference GetReference(string path)
    {
        return dbReference.Child(path);
    }
}
