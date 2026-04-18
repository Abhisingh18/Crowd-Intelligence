import streamlit as st
import cv2
import tempfile
import os
import pandas as pd
import numpy as np
import plotly.express as px
from main import process_video
from src.visualization import generate_density_plot, generate_direction_chart, overlay_heatmap

# Page Configuration
st.set_page_config(
    page_title="AI Pedestrian Analytics",
    page_icon="🚶‍♀️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main {
        background-color: #0e1117;
    }
    .stMetric {
        background-color: #1a1c24;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #30363d;
    }
    .metric-container {
        display: flex;
        justify-content: space-between;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar
st.sidebar.title("🚶‍♀️ Crowd Analysis Engine")
st.sidebar.markdown("---")
uploaded_file = st.sidebar.file_uploader("Upload Video (MP4)", type=["mp4", "mov", "avi"])
conf_threshold = st.sidebar.slider("Confidence Threshold", 0.1, 1.0, 0.25)
model_type = st.sidebar.selectbox("Model Size", ["yolov8n.pt", "yolov8m.pt", "yolov8l.pt"], index=1)

# Main Header
st.title("🏙️ Shibuya Scramble Analytics")
st.markdown("Automated pedestrian tracking, dwell-time analysis, and crowd density visualization.")

if uploaded_file is not None:
    # Save uploaded file to temp
    tfile = tempfile.NamedTemporaryFile(delete=False)
    tfile.write(uploaded_file.read())
    video_path = tfile.name

    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("Source Video")
        st.video(uploaded_file)
        
    with col2:
        st.subheader("Process Settings")
        run_btn = st.button("🚀 Run Analysis", use_container_width=True)
        
    if run_btn:
        with st.status("Analyzing footage...", expanded=True) as status:
            progress_bar = st.progress(0)
            
            output_video_path = os.path.join(tempfile.gettempdir(), "annotated_output.mp4")
            
            results = process_video(
                video_path, 
                output_path=output_video_path,
                model_path=model_type,
                progress_callback=lambda p: progress_bar.progress(p)
            )
            status.update(label="Analysis Complete!", state="complete")

        # --- RESULTS DISPLAY ---
        analytics = results['analytics']
        
        st.markdown("---")
        st.subheader("📊 Key Performance Metrics")
        
        m_col1, m_col2, m_col3, m_col4 = st.columns(4)
        
        dwell_times = analytics.calculate_dwell_times()
        avg_dwell = np.mean(list(dwell_times.values())) if dwell_times else 0
        
        m_col1.metric("Unique Pedestrians", analytics.get_unique_count())
        m_col2.metric("Avg Dwell Time", f"{avg_dwell:.2f}s")
        m_col3.metric("System Efficiency", f"{results['fps']:.1f} FPS")
        m_col4.metric("Processing Time", f"{results['processing_time']:.1f}s")

        tab1, tab2, tab3 = st.tabs(["🎥 Annotated Result", "🔥 Density Heatmap", "📈 Behavioral Insights"])

        with tab1:
            st.subheader("Object Tracking & IDs")
            # Convert video to web-friendly format if needed (opencv mp4v often needs conversion to libx264 for browser)
            # For simplicity, we'll try to display directly or inform user
            st.video(output_video_path)
            st.info("Output video shows consistent track IDs and movement trails.")

        with tab2:
            st.subheader("Crowd Density Heatmap")
            # Get original first frame for background
            cap = cv2.VideoCapture(video_path)
            ret, first_frame = cap.read()
            cap.release()
            
            if ret:
                heatmap = analytics.get_heatmap()
                overlay = overlay_heatmap(first_frame, heatmap)
                st.image(cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB), use_column_width=True)
            else:
                st.warning("Could not generate heatmap overlay.")

        with tab3:
            col_a, col_b = st.columns(2)
            
            with col_a:
                st.plotly_chart(generate_density_plot(analytics.get_density_df()), use_container_width=True)
            
            with col_b:
                directions = analytics.get_direction_distribution()
                st.plotly_chart(generate_direction_chart(directions), use_container_width=True)

        # JSON Export
        st.markdown("---")
        st.subheader("💾 Export Data")
        json_data = {
            "total_count": analytics.get_unique_count(),
            "avg_dwell_time": avg_dwell,
            "directions": directions,
            "processing_metadata": {
                "fps": results['fps'],
                "frames": len(analytics.density_over_time)
            }
        }
        st.download_button(
            label="Download JSON Report",
            data=str(json_data),
            file_name="analytics_report.json",
            mime="application/json"
        )

else:
    # Landing State
    st.info("Please upload a video file to begin analysis.")
    st.image("https://images.unsplash.com/photo-1542011681-9988549d2c5d?q=80&w=2000&auto=format&fit=crop", 
             caption="Crowded Crossing Analysis Ready")
