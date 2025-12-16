using UnityEngine;
using System.Collections;
using Firebase.Database;

public class PodDoorSync : MonoBehaviour
{
    public Transform doorTransform;

    public float closedX = 0f;
    public float openX = 8f;
    public float animationTime = 5f;

    private Coroutine movingCoroutine;
    private int currentState = -1;

    private DatabaseReference doorRef;

    private void Start()
    {
        StartCoroutine(ConnectToFirebase());
    }

    private IEnumerator ConnectToFirebase()
    {
        while (FirebaseManager.Instance == null)
        {
            yield return new WaitForSeconds(0.1f);
        }

        while (!FirebaseManager.IsReady)
        {
            yield return new WaitForSeconds(0.1f);
        }

        Debug.Log("Firebase готов — синхронизация двери");

        string path = "devices/Pod_01_entrada_01/door_state";
        doorRef = FirebaseManager.Instance.GetReference(path);

        doorRef.ValueChanged += HandleStateChanged;

        Debug.Log("Подписка готова");
    }

    private void OnDestroy()
    {
        if (doorRef != null)
        {
            doorRef.ValueChanged -= HandleStateChanged;
        }
    }

    private void HandleStateChanged(object sender, ValueChangedEventArgs args)
    {
        if (args.DatabaseError != null) return;
        if (args.Snapshot.Value == null) return;

        int state = (int)(long)args.Snapshot.Value;
        Debug.Log("Состояние из базы: " + state);
        UpdateDoor(state);
    }

    // НОВАЯ ФУНКЦИЯ: кнопка "Открыть" вызывает это
    public void SendOpenCommand()
    {
        if (doorRef != null)
        {
            doorRef.SetValueAsync(1);  // отправляем 1 = открывается
            Debug.Log("Команда отправлена: открыть дверь");
        }
    }

    // НОВАЯ ФУНКЦИЯ: кнопка "Закрыть" вызывает это
    public void SendCloseCommand()
    {
        if (doorRef != null)
        {
            doorRef.SetValueAsync(3);  // отправляем 3 = закрывается
            Debug.Log("Команда отправлена: закрыть дверь");
        }
    }

    private void UpdateDoor(int state)
    {
        if (state == currentState) return;

        if (movingCoroutine != null)
        {
            StopCoroutine(movingCoroutine);
            movingCoroutine = null;
        }

        if (state == 0 || state == 2)
        {
            float target = state == 0 ? closedX : openX;
            doorTransform.localPosition = new Vector3(target, doorTransform.localPosition.y, doorTransform.localPosition.z);
        }
        else if (state == 1)
        {
            movingCoroutine = StartCoroutine(MoveTo(openX));
        }
        else if (state == 3)
        {
            movingCoroutine = StartCoroutine(MoveTo(closedX));
        }

        currentState = state;
    }

    private IEnumerator MoveTo(float targetX)
    {
        Vector3 start = doorTransform.localPosition;
        Vector3 end = new Vector3(targetX, start.y, start.z);

        float distance = Mathf.Abs(start.x - targetX);
        float full = Mathf.Abs(openX - closedX);
        float time = animationTime * (distance / full);

        if (time < 0.1f)
        {
            doorTransform.localPosition = end;
            yield break;
        }

        float elapsed = 0f;
        while (elapsed < time)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / time;
            doorTransform.localPosition = Vector3.Lerp(start, end, t);
            yield return null;
        }

        doorTransform.localPosition = end;
    }
}
