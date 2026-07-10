import os
import time
import hashlib
from tqdm import tqdm
from dotenv import load_dotenv
from datasets import load_dataset
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from pinecone import Pinecone,ServerlessSpec
from langchain_text_splitters import RecursiveCharacterTextSplitter,MarkdownHeaderTextSplitter,Language
from typing_extensions import TypedDict
from tenacity import retry, wait_exponential, stop_after_attempt

load_dotenv()

HF_TOKEN         = os.getenv("HF_TOKEN")
EMBEDDING_MODEL  = "BAAI/bge-m3"

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = "kb-index"
PINECONE_CLOUD   = "aws"
PINECONE_REGION  = "us-east-1"
EMBED_DIM        = 1024
PINECONE_BATCH = 100
MAX_WEB_RECORDS = 10000
MAX_DS_RECORD = 10000

_embed_model: HuggingFaceEndpointEmbeddings | None = None
_pinecone_index = None

class Chunk(TypedDict):
   chunk_id:str
   text:str
   chunk_index:int
   code_solution:str
   source:str
   token_count:int

pc = Pinecone(api_key=PINECONE_API_KEY)

def _get_embed_model() -> HuggingFaceEndpointEmbeddings:
    """Returns a singleton HuggingFace embeddings client."""
    global _embed_model
    if _embed_model is None:
        if not HF_TOKEN:
            raise ValueError("HF_TOKEN not set in .env")
        print(f"[chunk_embed] Connecting to HuggingFace Inference API ({EMBEDDING_MODEL})...")
        _embed_model = HuggingFaceEndpointEmbeddings(
            model=EMBEDDING_MODEL,
            huggingfacehub_api_token=HF_TOKEN,
        )
        print(f"[chunk_embed] HF client ready.")
    return _embed_model

def _get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        if not PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY not set in .env")

        pc = Pinecone(api_key=PINECONE_API_KEY)

        existing = [idx.name for idx in pc.list_indexes()]
        if PINECONE_INDEX not in existing:
            print(f"[chunk_embed] Creating Pinecone index '{PINECONE_INDEX}'...")
            pc.create_index(
                name      = PINECONE_INDEX,
                dimension = EMBED_DIM,
                metric    = "cosine",
                spec      = ServerlessSpec(
                    cloud  = PINECONE_CLOUD,
                    region = PINECONE_REGION,
                ),
            )
            while not pc.describe_index(PINECONE_INDEX).status["ready"]:
                print("[chunk_embed] Waiting for index to be ready...")
                time.sleep(2)
            print(f"[chunk_embed] Index '{PINECONE_INDEX}' created.")
        else:
            print(f"[chunk_embed] Using existing index '{PINECONE_INDEX}'.")

        _pinecone_index = pc.Index(PINECONE_INDEX)
    return _pinecone_index

@retry(
    wait=wait_exponential(min=2, max=10),
    stop=stop_after_attempt(3),
    reraise=True,
)
def _embed_texts_with_retry(model: HuggingFaceEndpointEmbeddings, texts: list[str]) -> list[list[float]]:
    """Calls the HuggingFace API with automatic retry on rate limit errors."""
    return model.embed_documents(texts)

def _load_datasets() -> list[Chunk]:
   # print("Loading iamtarun/python_code_instructions_18k_alpaca...")
   # alpaca_ds = load_dataset("iamtarun/python_code_instructions_18k_alpaca", split="train")
   chunks = []
   # for idx, row in enumerate(alpaca_ds):
        
   #    search_text = f"{row['instruction']} {row['input']}".strip()
   #    code_solution = row['output']
      
   #    chunk_hash = hashlib.md5(f"alpaca_{idx}".encode()).hexdigest()[:8]
   #    chunks.append(Chunk(
   #       chunk_id=f"chunk_alpaca_{idx:04d}_{chunk_hash}",
   #       text=search_text,       # Sent to BGE-M3 for vector embeddings
   #       chunk_index= idx,
   #       token_count= len(search_text.split()),
   #       code_solution= code_solution, # Kept in metadata to pass to the LLM
   #       source="iamtarun_18k"
   #    ))
   
   # print("Loading flytech/python-codes-25k...")
   # flytech_ds = load_dataset("flytech/python-codes-25k", split="train")
   
   # for idx, row in enumerate(flytech_ds):
   #    search_text = f"{row['instruction']} {row['input']}".strip()
   #    code_solution = row['output']
        
   #    chunk_hash = hashlib.md5(f"flytech_{idx}".encode()).hexdigest()[:8]
   #    chunks.append(Chunk(
   #          chunk_id = f"chunk_flytech_{idx:04d}_{chunk_hash}",
   #          text= search_text,
   #          chunk_index= idx,
   #          token_count = len(search_text.split()),
   #          code_solution =  code_solution,
   #          source = "flytech_25k"
   #    ))

   # print("Loading Qwen-59k-Python-Instruct (Web Frameworks)...")
   # web_ds = load_dataset("karti06k/Qwen-59k-Python-Instruct", split="train")
   
   # web_subset = web_ds.select(range(min(MAX_WEB_RECORDS, len(web_ds))))
    
   # for idx, row in enumerate(web_subset):
   #    # Combining the instruction and the input context for the search vector
   #    search_text = f"{row.get('instruction', '')} {row.get('input', '')}".strip()
   #    code_solution = row.get('output', '')
        
   #    chunk_hash = hashlib.md5(f"web_{idx}".encode()).hexdigest()[:8]
   #    chunks.append(Chunk(
   #       chunk_id =  f"chunk_web_{idx:04d}_{chunk_hash}",
   #       text = search_text,
   #       chunk_index = idx,
   #       token_count = len(search_text.split()),
   #       code_solution = code_solution, 
   #       source = "qwen_web_frameworks"
   #    ))
   
   # print("Loading ds-coder-instruct-v1 (Data Science)...")
   # ds_dataset = load_dataset("ed001/ds-coder-instruct-v1", split="train")
    
   # # Slice to respect free tier
   # ds_subset = ds_dataset.select(range(min(MAX_DS_RECORD, len(ds_dataset))))
    
   # for idx, row in enumerate(ds_subset):
   #    search_text = f"{row.get('instruction', '')} {row.get('input', '')}".strip()
   #    code_solution = row.get('output', '')
        
   #    chunk_hash = hashlib.md5(f"ds_{idx}".encode()).hexdigest()[:8]
   #    chunks.append(Chunk(
   #       chunk_id = f"chunk_ds_{idx:04d}_{chunk_hash}",
   #       text = search_text,
   #       chunk_index = idx,
   #       token_count = len(search_text.split()),
   #       code_solution = code_solution,
   #       source = "ds_coder_pandas"
   #    ))
   
   print("Loading ammarnasr/Python-Security-Code-Dataset (Cybersecurity)...")
   sec_dataset = load_dataset("ammarnasr/Python-Security-Code-Dataset", split="train")
        
   MAX_SEC_RECORDS = 5000
   sec_subset = sec_dataset.select(range(min(MAX_SEC_RECORDS, len(sec_dataset))))
   
   for idx, row in enumerate(sec_subset):
      snippet = row.get('text', '').strip()
      
      if not snippet:
            continue
            
      # THE FIX: Truncate the search text to ~4000 characters so the API doesn't hang.
      # BGE-M3 is smart enough to capture the semantic meaning in the first 4000 chars.
      # We still keep the full snippet in the code_solution for the LLM.
      safe_search_text = snippet[:4000] 
            
      chunk_hash = hashlib.md5(f"sec_{idx}".encode()).hexdigest()[:8]
      chunks.append(Chunk(
            chunk_id = f"chunk_sec_{idx:04d}_{chunk_hash}",
            text = safe_search_text,      # Truncated string sent to Hugging Face
            chunk_index = idx,
            token_count = len(snippet.split()),
            code_solution = snippet,      # Full string saved in Pinecone metadata
            source = "ammarnasr_security"
      ))

   print(f"Total advanced framework instructions ready: {len(chunks)}")
   return chunks

def _embed_chunks(chunks:list[Chunk],batch_size:int = 100) -> list[tuple[Chunk,list[float]]]:
   """Embeds all chunks via BGE-M3 on the HuggingFace Inference API."""
   if not chunks:
      return []
   try:
      model = _get_embed_model()
      results = []
      total_batches = (len(chunks) // batch_size) + 1
      
      print(f"[chunk_embed] Embedding {len(chunks)} chunks via HuggingFace API ({EMBEDDING_MODEL})...")

      for i in tqdm(range(0, len(chunks), batch_size), desc="Embedding Data", colour="green", unit="batch"):
         batch = chunks[i:i + batch_size]
         texts = [f"Represent this sentence: {c['text']}" for c in batch]
         embeddings = _embed_texts_with_retry(model, texts)
         results.extend(list(zip(batch, embeddings)))
         
         time.sleep(0.2) 

      print(f"[chunk_embed] Successfully got {len(results)} embeddings.")
      return results
   except Exception as e:
      print(f"There is an error in embedded chunks {e}")
      raise e

def _upsert_to_pinecone(chunk_embeddings:list[tuple[Chunk,list[float]]]) -> int:
   if not chunk_embeddings:
      return 0
   
   index = _get_pinecone_index()
   total_upserted = 0
   
   vectors = []
   for chunk,embedding in chunk_embeddings:
      vectors.append({
         "id":chunk["chunk_id"],
         "values":embedding,
         "metadata":{
            "text":chunk["text"],
            "chunk_index":chunk["chunk_index"],
            "code_solution":chunk["code_solution"],
            "source":chunk["source"],
            "token_count":chunk["token_count"],
         }  
      })
   
   for batch_start in tqdm(range(0,len(vectors),PINECONE_BATCH), desc="Upserting Vectors", colour="green", unit="batch"):
      batch = vectors[batch_start:batch_start+PINECONE_BATCH]
      index.upsert(vectors=batch)
      total_upserted += len(batch)

      time.sleep(0.5)
      
   return total_upserted

def _retrival_argument_generation():
   chunks = _load_datasets()
   if not chunks:
      return {
         "chunks_created":   0,
         "vectors_upserted": 0,
         "error":"No chunks produced — transcript may be empty",
      }
   
   chunk_embeddings = _embed_chunks(chunks)
   total_upserted = _upsert_to_pinecone(chunk_embeddings)
   
   summary = {
      "chunks_created":   len(chunks),
      "vectors_upserted": total_upserted,
      "token_stats": {
         "total_tokens": sum(c["token_count"] for c in chunks),
         "avg_tokens":   round(sum(c["token_count"] for c in chunks) / len(chunks), 1),
         "min_tokens":   min(c["token_count"] for c in chunks),
         "max_tokens":   max(c["token_count"] for c in chunks),
      },
   }
   
   return summary

if __name__ == "__main__":
   summary = _retrival_argument_generation()
   