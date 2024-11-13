"""All Video Intelligence API features run on a video stored on GCS."""
from google.cloud import videointelligence

import time

gcs_uri = "gs://fiddleml/MASTER v30_RB_11.04 SXSW CUT - 11.4 export.mp4"
output_uri = "gs://fiddleml/output - {}.json".format(time.time())

video_client = videointelligence.VideoIntelligenceServiceClient.from_service_account_file(
    "/Users/kcahill/Downloads/video-intelligence-api-visualiser-main/nova-436119-281cfbc9b35b.json")

features = [
    videointelligence.Feature.LOGO_RECOGNITION
]

transcript_config = videointelligence.SpeechTranscriptionConfig(
    language_code="en-US", enable_automatic_punctuation=True
)

person_config = videointelligence.PersonDetectionConfig(
    include_bounding_boxes=True,
    include_attributes=False,
    include_pose_landmarks=True,
)

face_config = videointelligence.FaceDetectionConfig(
    include_bounding_boxes=True, include_attributes=True
)


video_context = videointelligence.VideoContext(
    speech_transcription_config=transcript_config,
    person_detection_config=person_config,
    face_detection_config=face_config)

operation = video_client.annotate_video(
    request={"features": features,
             "input_uri": gcs_uri,
             "output_uri": output_uri,
             "video_context": video_context}
)

print("\nProcessing video.", operation)

result = operation.result(timeout=300)

print("\n finished processing.")

# print(result)

