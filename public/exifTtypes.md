EXIF Tags
EXIF stands for "Exchangeable Image File Format". This type of information is formatted according to the TIFF specification, and may be found in JPG, TIFF, PNG, JP2, PGF, MIFF, HDP, PSP and XCF images, as well as many TIFF-based RAW images, and even some AVI and MOV videos.

The EXIF meta information is organized into different Image File Directories (IFD's) within an image. The names of these IFD's correspond to the ExifTool family 1 group names. When writing EXIF information, the default Group listed below is used unless another group is specified.

Mandatory tags (indicated by a colon after the Writable type) may be added automatically with default values when creating a new IFD, and the IFD is removed automatically when deleting tags if only default-valued mandatory tags remain.

The table below lists all EXIF tags. Also listed are TIFF, DNG, HDP and other tags which are not part of the EXIF specification, but may co-exist with EXIF tags in some images. Tags which are part of the EXIF 2.32 specification have an underlined Tag Name in the HTML version of this documentation. See https://web.archive.org/web/20190624045241if_/http://www.cipa.jp:80/std/documents/e/DC-008-Translation-2019-E.pdf for the official EXIF 2.32 specification.

Tag ID	Tag Name	Writable	Group	Values / Notes
0x0001	InteropIndex	string!	InteropIFD	'R03' = R03 - DCF option file (Adobe RGB)
'R98' = R98 - DCF basic file (sRGB)
'THM' = THM - DCF thumbnail file
0x0002	InteropVersion	undef!:	InteropIFD	 
0x000b	ProcessingSoftware	string	IFD0	(used by ACD Systems Digital Imaging)
0x00fe	SubfileType	int32u!	IFD0	(called NewSubfileType by the TIFF specification)
0x0 = Full-resolution image
0x1 = Reduced-resolution image
0x2 = Single page of multi-page image
0x3 = Single page of multi-page reduced-resolution image
0x4 = Transparency mask
0x5 = Transparency mask of reduced-resolution image
0x6 = Transparency mask of multi-page image
0x7 = Transparency mask of reduced-resolution multi-page image
0x8 = Depth map
0x9 = Depth map of reduced-resolution image
0x10 = Enhanced image data
0x10001 = Alternate reduced-resolution image
0x10004 = Semantic Mask
0xffffffff = invalid
Bit 0 = Reduced resolution
Bit 1 = Single page
Bit 2 = Transparency mask
Bit 3 = TIFF/IT final page
Bit 4 = TIFF-FX mixed raster content
0x00ff	OldSubfileType	int16u!	IFD0	(called SubfileType by the TIFF specification)
1 = Full-resolution image
2 = Reduced-resolution image
3 = Single page of multi-page image
0x0100	ImageWidth	int32u!	IFD0	 
0x0101	ImageHeight	int32u!	IFD0	(called ImageLength by the EXIF spec.)
0x0102	BitsPerSample	int16u[n]!	IFD0	 
0x0103	Compression	int16u!:	IFD0	--> EXIF Compression Values
0x0106	PhotometricInterpretation	int16u!	IFD0	
0 = WhiteIsZero
1 = BlackIsZero
2 = RGB
3 = RGB Palette
4 = Transparency Mask
5 = CMYK
6 = YCbCr
8 = CIELab
9 = ICCLab
10 = ITULab
32803 = Color Filter Array
32844 = Pixar LogL
32845 = Pixar LogLuv
32892 = Sequential Color Filter
34892 = Linear Raw
51177 = Depth Map
52527 = Semantic Mask
0x0107	Thresholding	int16u!	IFD0	1 = No dithering or halftoning
2 = Ordered dither or halftone
3 = Randomized dither
0x0108	CellWidth	int16u!	IFD0	 
0x0109	CellLength	int16u!	IFD0	 
0x010a	FillOrder	int16u!	IFD0	1 = Normal
2 = Reversed
0x010d	DocumentName	string	IFD0	 
0x010e	ImageDescription	string	IFD0	 
0x010f	Make	string	IFD0	 
0x0110	Model	string	IFD0	 
0x0111	StripOffsets
OtherImageStart
PreviewJXLStart
StripOffsets
PreviewImageStart
PreviewImageStart
JpgFromRawStart	no
no
no
no
int32u*
int32u*
int32u*	-
-
-
-
IFD0
All
SubIFD2	(called StripOffsets in most locations, but it is PreviewImageStart in IFD0 of CR2 images and various IFD's of DNG images except for SubIFD2 where it is JpgFromRawStart)
0x0112	Orientation	int16u	IFD0	
1 = Horizontal (normal)
2 = Mirror horizontal
3 = Rotate 180
4 = Mirror vertical
5 = Mirror horizontal and rotate 270 CW
6 = Rotate 90 CW
7 = Mirror horizontal and rotate 90 CW
8 = Rotate 270 CW
0x0115	SamplesPerPixel	int16u!	IFD0	 
0x0116	RowsPerStrip	int32u!	IFD0	 
0x0117	StripByteCounts
OtherImageLength
PreviewJXLLength
StripByteCounts
PreviewImageLength
PreviewImageLength
JpgFromRawLength	no
no
no
no
int32u*
int32u*
int32u*	-
-
-
-
IFD0
All
SubIFD2	(called StripByteCounts in most locations, but it is PreviewImageLength in IFD0 of CR2 images and various IFD's of DNG images except for SubIFD2 where it is JpgFromRawLength)
0x0118	MinSampleValue	int16u	IFD0	 
0x0119	MaxSampleValue	int16u	IFD0	 
0x011a	XResolution	rational64u:	IFD0	 
0x011b	YResolution	rational64u:	IFD0	 
0x011c	PlanarConfiguration	int16u!	IFD0	1 = Chunky
2 = Planar
0x011d	PageName	string	IFD0	 
0x011e	XPosition	rational64u	IFD0	 
0x011f	YPosition	rational64u	IFD0	 
0x0120	FreeOffsets	no	-	 
0x0121	FreeByteCounts	no	-	 
0x0122	GrayResponseUnit	int16u	IFD0	1 = 0.1
2 = 0.001
3 = 0.0001
4 = 1e-05
5 = 1e-06
0x0123	GrayResponseCurve	no	-	 
0x0124	T4Options	no	-	Bit 0 = 2-Dimensional encoding
Bit 1 = Uncompressed
Bit 2 = Fill bits added
0x0125	T6Options	no	-	Bit 1 = Uncompressed
0x0128	ResolutionUnit	int16u:	IFD0	(the value 1 is not standard EXIF)
1 = None
2 = inches
3 = cm
0x0129	PageNumber	int16u[2]	IFD0	 
0x012c	ColorResponseUnit	no	-	 
0x012d	TransferFunction	int16u[768]!	IFD0	 
0x0131	Software	string	IFD0	 
0x0132	ModifyDate	string	IFD0	(called DateTime by the EXIF spec.)
0x013b	Artist	string	IFD0	(becomes a list-type tag when the MWG module is loaded)
0x013c	HostComputer	string	IFD0	 
0x013d	Predictor	int16u!	IFD0	
1 = None
2 = Horizontal differencing
3 = Floating point
34892 = Horizontal difference X2
34893 = Horizontal difference X4
34894 = Floating point X2
34895 = Floating point X4
0x013e	WhitePoint	rational64u[2]	IFD0	 
0x013f	PrimaryChromaticities	rational64u[6]	IFD0	 
0x0140	ColorMap	no	-	 
0x0141	HalftoneHints	int16u[2]	IFD0	 
0x0142	TileWidth	int32u!	IFD0	 
0x0143	TileLength	int32u!	IFD0	 
0x0144	TileOffsets	no	-	 
0x0145	TileByteCounts	no	-	 
0x0146	BadFaxLines	no	-	 
0x0147	CleanFaxData	no	-	0 = Clean
1 = Regenerated
2 = Unclean
0x0148	ConsecutiveBadFaxLines	no	-	 
0x014a	SubIFD
A100DataOffset	-
no	-
IFD0	--> EXIF Tags
(the data offset in original Sony DSLR-A100 ARW images)
0x014c	InkSet	int16u	IFD0	1 = CMYK
2 = Not CMYK
0x014d	InkNames	no	-	 
0x014e	NumberofInks	no	-	 
0x0150	DotRange	no	-	 
0x0151	TargetPrinter	string	IFD0	 
0x0152	ExtraSamples	no	-	0 = Unspecified
1 = Associated Alpha
2 = Unassociated Alpha
0x0153	SampleFormat	no	SubIFD	(SamplesPerPixel values)
[Values 0-3]
1 = Unsigned
2 = Signed
3 = Float	  	4 = Undefined
5 = Complex int
6 = Complex float
0x0154	SMinSampleValue	no	-	 
0x0155	SMaxSampleValue	no	-	 
0x0156	TransferRange	no	-	 
0x0157	ClipPath	no	-	 
0x0158	XClipPathUnits	no	-	 
0x0159	YClipPathUnits	no	-	 
0x015a	Indexed	no	-	0 = Not indexed
1 = Indexed
0x015b	JPEGTables	no	-	 
0x015f	OPIProxy	no	-	0 = Higher resolution image does not exist
1 = Higher resolution image exists
0x0190	GlobalParametersIFD	-	-	--> EXIF Tags
0x0191	ProfileType	no	-	0 = Unspecified
1 = Group 3 FAX
0x0192	FaxProfile	no	-	
0 = Unknown
1 = Minimal B&W lossless, S
2 = Extended B&W lossless, F
3 = Lossless JBIG B&W, J
4 = Lossy color and grayscale, C
5 = Lossless color and grayscale, L
6 = Mixed raster content, M
7 = Profile T
255 = Multi Profiles
0x0193	CodingMethods	no	-	
Bit 0 = Unspecified compression
Bit 1 = Modified Huffman
Bit 2 = Modified Read
Bit 3 = Modified MR
Bit 4 = JBIG
Bit 5 = Baseline JPEG
Bit 6 = JBIG color
0x0194	VersionYear	no	-	 
0x0195	ModeNumber	no	-	 
0x01b1	Decode	no	-	 
0x01b2	DefaultImageColor	no	-	 
0x01b3	T82Options	no	-	 
0x01b5	JPEGTables	no	-	 
0x0200	JPEGProc	no	-	1 = Baseline
14 = Lossless
0x0201	ThumbnailOffset
ThumbnailOffset
ThumbnailOffset
PreviewImageStart
PreviewImageStart
JpgFromRawStart
JpgFromRawStart
OtherImageStart
OtherImageStart
OtherImageStart	int32u*
int32u*
int32u*
int32u*
int32u*
int32u*
int32u*
int32u*
int32u*
no	IFD1
IFD0
SubIFD
MakerNotes
IFD0
SubIFD
IFD2
SubIFD1
SubIFD2
-	(called JPEGInterchangeFormat in the specification, this is ThumbnailOffset in IFD1 of JPEG and some TIFF-based images, IFD0 of MRW images and AVI and MOV videos, and the SubIFD in IFD1 of SRW images; PreviewImageStart in MakerNotes and IFD0 of ARW and SR2 images; JpgFromRawStart in SubIFD of NEF images and IFD2 of PEF images; and OtherImageStart in everything else)
0x0202	ThumbnailLength
ThumbnailLength
ThumbnailLength
PreviewImageLength
PreviewImageLength
JpgFromRawLength
JpgFromRawLength
OtherImageLength
OtherImageLength
OtherImageLength	int32u*
int32u*
int32u*
int32u*
int32u*
int32u*
int32u*
int32u*
int32u*
no	IFD1
IFD0
SubIFD
MakerNotes
IFD0
SubIFD
IFD2
SubIFD1
SubIFD2
-	(called JPEGInterchangeFormatLength in the specification, this is ThumbnailLength in IFD1 of JPEG and some TIFF-based images, IFD0 of MRW images and AVI and MOV videos, and the SubIFD in IFD1 of SRW images; PreviewImageLength in MakerNotes and IFD0 of ARW and SR2 images; JpgFromRawLength in SubIFD of NEF images, and IFD2 of PEF images; and OtherImageLength in everything else)
0x0203	JPEGRestartInterval	no	-	 
0x0205	JPEGLosslessPredictors	no	-	 
0x0206	JPEGPointTransforms	no	-	 
0x0207	JPEGQTables	no	-	 
0x0208	JPEGDCTables	no	-	 
0x0209	JPEGACTables	no	-	 
0x0211	YCbCrCoefficients	rational64u[3]!	IFD0	 
0x0212	YCbCrSubSampling	int16u[2]!	IFD0	
'1 1' = YCbCr4:4:4 (1 1)
'1 2' = YCbCr4:4:0 (1 2)
'1 4' = YCbCr4:4:1 (1 4)
'2 1' = YCbCr4:2:2 (2 1)	  	'2 2' = YCbCr4:2:0 (2 2)
'2 4' = YCbCr4:2:1 (2 4)
'4 1' = YCbCr4:1:1 (4 1)
'4 2' = YCbCr4:1:0 (4 2)
0x0213	YCbCrPositioning	int16u!:	IFD0	1 = Centered
2 = Co-sited
0x0214	ReferenceBlackWhite	rational64u[6]	IFD0	 
0x022f	StripRowCounts	no	-	 
0x02bc	ApplicationNotes	int8u!	IFD0	--> XMP Tags
0x0303	RenderingIntent	no	-	0 = Perceptual
1 = Relative Colorimetric
2 = Saturation
3 = Absolute colorimetric
0x03e7	USPTOMiscellaneous	no	-	 
0x1000	RelatedImageFileFormat	string!	InteropIFD	 
0x1001	RelatedImageWidth	int16u!	InteropIFD	 
0x1002	RelatedImageHeight	int16u!	InteropIFD	(called RelatedImageLength by the DCF spec.)
0x4746	Rating	int16u/	IFD0	 
0x4747	XP_DIP_XML	no	-	 
0x4748	StitchInfo	-	-	--> Microsoft Stitch Tags
0x4749	RatingPercent	int16u/	IFD0	 
0x5001	ResolutionXUnit	no	-	(ID's from 0x5001 to 0x5113 are obscure tags defined by Microsoft)
0x5002	ResolutionYUnit	no	-	 
0x5003	ResolutionXLengthUnit	no	-	 
0x5004	ResolutionYLengthUnit	no	-	 
0x5005	PrintFlags	no	-	 
0x5006	PrintFlagsVersion	no	-	 
0x5007	PrintFlagsCrop	no	-	 
0x5008	PrintFlagsBleedWidth	no	-	 
0x5009	PrintFlagsBleedWidthScale	no	-	 
0x500a	HalftoneLPI	no	-	 
0x500b	HalftoneLPIUnit	no	-	 
0x500c	HalftoneDegree	no	-	 
0x500d	HalftoneShape	no	-	 
0x500e	HalftoneMisc	no	-	 
0x500f	HalftoneScreen	no	-	 
0x5010	JPEGQuality	no	-	 
0x5011	GridSize	no	-	 
0x5012	ThumbnailFormat	no	-	 
0x5013	ThumbnailWidth	no	-	 
0x5014	ThumbnailHeight	no	-	 
0x5015	ThumbnailColorDepth	no	-	 
0x5016	ThumbnailPlanes	no	-	 
0x5017	ThumbnailRawBytes	no	-	 
0x5018	ThumbnailLength	no	-	 
0x5019	ThumbnailCompressedSize	no	-	 
0x501a	ColorTransferFunction	no	-	 
0x501b	ThumbnailData	no	-	 
0x5020	ThumbnailImageWidth	no	-	 
0x5021	ThumbnailImageHeight	no	-	 
0x5022	ThumbnailBitsPerSample	no	-	 
0x5023	ThumbnailCompression	no	-	 
0x5024	ThumbnailPhotometricInterp	no	-	 
0x5025	ThumbnailDescription	no	-	 
0x5026	ThumbnailEquipMake	no	-	 
0x5027	ThumbnailEquipModel	no	-	 
0x5028	ThumbnailStripOffsets	no	-	 
0x5029	ThumbnailOrientation	no	-	 
0x502a	ThumbnailSamplesPerPixel	no	-	 
0x502b	ThumbnailRowsPerStrip	no	-	 
0x502c	ThumbnailStripByteCounts	no	-	 
0x502d	ThumbnailResolutionX	no	-	 
0x502e	ThumbnailResolutionY	no	-	 
0x502f	ThumbnailPlanarConfig	no	-	 
0x5030	ThumbnailResolutionUnit	no	-	 
0x5031	ThumbnailTransferFunction	no	-	 
0x5032	ThumbnailSoftware	no	-	 
0x5033	ThumbnailDateTime	no	-	 
0x5034	ThumbnailArtist	no	-	 
0x5035	ThumbnailWhitePoint	no	-	 
0x5036	ThumbnailPrimaryChromaticities	no	-	 
0x5037	ThumbnailYCbCrCoefficients	no	-	 
0x5038	ThumbnailYCbCrSubsampling	no	-	 
0x5039	ThumbnailYCbCrPositioning	no	-	 
0x503a	ThumbnailRefBlackWhite	no	-	 
0x503b	ThumbnailCopyright	no	-	 
0x5090	LuminanceTable	no	-	 
0x5091	ChrominanceTable	no	-	 
0x5100	FrameDelay	no	-	 
0x5101	LoopCount	no	-	 
0x5102	GlobalPalette	no	-	 
0x5103	IndexBackground	no	-	 
0x5104	IndexTransparent	no	-	 
0x5110	PixelUnits	no	-	 
0x5111	PixelsPerUnitX	no	-	 
0x5112	PixelsPerUnitY	no	-	 
0x5113	PaletteHistogram	no	-	 
0x7000	SonyRawFileType	no	-	0 = Sony Uncompressed 14-bit RAW
1 = Sony Uncompressed 12-bit RAW
2 = Sony Compressed RAW
3 = Sony Lossless Compressed RAW
4 = Sony Lossless Compressed RAW 2
0x7010	SonyToneCurve	no	-	 
0x7031	VignettingCorrection	int16s!	SubIFD	(found in Sony ARW images)
256 = Off
257 = Auto
272 = Auto (ILCE-1)
511 = No correction params available
0x7032	VignettingCorrParams	int16s[17]!	SubIFD	(found in Sony ARW images)
0x7034	ChromaticAberrationCorrection	int16s!	SubIFD	(found in Sony ARW images)
0 = Off
1 = Auto
255 = No correction params available
0x7035	ChromaticAberrationCorrParams	int16s[33]!	SubIFD	(found in Sony ARW images)
0x7036	DistortionCorrection	int16s!	SubIFD	(found in Sony ARW images)
0 = Off
1 = Auto
17 = Auto fixed by lens
255 = No correction params available
0x7037	DistortionCorrParams	int16s[17]!	SubIFD	(found in Sony ARW images)
0x7038	SonyRawImageSize	int32u[2]!	SubIFD	(size of actual image in Sony ARW files)
0x7310	BlackLevel	int16u[4]!	SubIFD	(found in Sony ARW images)
0x7313	WB_RGGBLevels	int16s[4]!	SubIFD	(found in Sony ARW images)
0x74c7	SonyCropTopLeft	int32u[2]!	SubIFD	 
0x74c8	SonyCropSize	int32u[2]!	SubIFD	 
0x800d	ImageID	no	-	 
0x80a3	WangTag1	no	-	 
0x80a4	WangAnnotation	no	-	 
0x80a5	WangTag3	no	-	 
0x80a6	WangTag4	no	-	 
0x80b9	ImageReferencePoints	no	-	 
0x80ba	RegionXformTackPoint	no	-	 
0x80bb	WarpQuadrilateral	no	-	 
0x80bc	AffineTransformMat	no	-	 
0x80e3	Matteing	no	-	 
0x80e4	DataType	no	-	 
0x80e5	ImageDepth	no	-	 
0x80e6	TileDepth	no	-	 
0x8214	ImageFullWidth	no	-	 
0x8215	ImageFullHeight	no	-	 
0x8216	TextureFormat	no	-	 
0x8217	WrapModes	no	-	 
0x8218	FovCot	no	-	 
0x8219	MatrixWorldToScreen	no	-	 
0x821a	MatrixWorldToCamera	no	-	 
0x827d	Model2	no	-	 
0x828d	CFARepeatPatternDim	int16u[2]!	SubIFD	 
0x828e	CFAPattern2	int8u[n]!	SubIFD	 
0x828f	BatteryLevel	no	-	 
0x8290	KodakIFD	-	-	--> Kodak IFD Tags
(used in various types of Kodak images)
0x8298	Copyright	string	IFD0	(may contain copyright notices for photographer and editor, separated by a newline. As per the EXIF specification, the newline is replaced by a null byte when writing to file, but this may be avoided by disabling the print conversion)
0x829a	ExposureTime	rational64u	ExifIFD	 
0x829d	FNumber	rational64u	ExifIFD	 
0x82a5	MDFileTag	no	-	(tags 0x82a5-0x82ac are used in Molecular Dynamics GEL files)
0x82a6	MDScalePixel	no	-	 
0x82a7	MDColorTable	no	-	 
0x82a8	MDLabName	no	-	 
0x82a9	MDSampleInfo	no	-	 
0x82aa	MDPrepDate	no	-	 
0x82ab	MDPrepTime	no	-	 
0x82ac	MDFileUnits	no	-	 
0x830e	PixelScale	double[3]	IFD0	 
0x8335	AdventScale	no	-	 
0x8336	AdventRevision	no	-	 
0x835c	UIC1Tag	no	-	 
0x835d	UIC2Tag	no	-	 
0x835e	UIC3Tag	no	-	 
0x835f	UIC4Tag	no	-	 
0x83bb	IPTC-NAA	int32u!	IFD0	--> IPTC Tags
0x847e	IntergraphPacketData	no	-	 
0x847f	IntergraphFlagRegisters	no	-	 
0x8480	IntergraphMatrix	double[n]	IFD0	 
0x8481	INGRReserved	no	-	 
0x8482	ModelTiePoint	double[n]	IFD0	 
0x84e0	Site	no	-	 
0x84e1	ColorSequence	no	-	 
0x84e2	IT8Header	no	-	 
0x84e3	RasterPadding	no	-	0 = Byte
1 = Word
2 = Long Word
9 = Sector
10 = Long Sector
0x84e4	BitsPerRunLength	no	-	 
0x84e5	BitsPerExtendedRunLength	no	-	 
0x84e6	ColorTable	no	-	 
0x84e7	ImageColorIndicator	no	-	0 = Unspecified Image Color
1 = Specified Image Color
0x84e8	BackgroundColorIndicator	no	-	0 = Unspecified Background Color
1 = Specified Background Color
0x84e9	ImageColorValue	no	-	 
0x84ea	BackgroundColorValue	no	-	 
0x84eb	PixelIntensityRange	no	-	 
0x84ec	TransparencyIndicator	no	-	 
0x84ed	ColorCharacterization	no	-	 
0x84ee	HCUsage	no	-	0 = CT
1 = Line Art
2 = Trap
0x84ef	TrapIndicator	no	-	 
0x84f0	CMYKEquivalent	no	-	 
0x8546	SEMInfo	string	IFD0	(found in some scanning electron microscope images)
0x8568	AFCP_IPTC	-	-	--> IPTC Tags
0x85b8	PixelMagicJBIGOptions	no	-	 
0x85d7	JPLCartoIFD	no	-	 
0x85d8	ModelTransform	double[16]	IFD0	 
0x8602	WB_GRGBLevels	no	-	(found in IFD0 of Leaf MOS images)
0x8606	LeafData	-	-	--> Leaf Tags
0x8649	PhotoshopSettings	-	IFD0	--> Photoshop Tags
0x8769	ExifOffset	-	IFD0	--> EXIF Tags
0x8773	ICC_Profile	-	IFD0	--> ICC_Profile Tags
0x877f	TIFF_FXExtensions	no	-	Bit 0 = Resolution/Image Width
Bit 1 = N Layer Profile M
Bit 2 = Shared Data
Bit 3 = B&W JBIG2
Bit 4 = JBIG2 Profile M
0x8780	MultiProfiles	no	-	
Bit 0 = Profile S
Bit 1 = Profile F
Bit 2 = Profile J
Bit 3 = Profile C
Bit 4 = Profile L
Bit 5 = Profile M
Bit 6 = Profile T
Bit 7 = Resolution/Image Width
Bit 8 = N Layer Profile M
Bit 9 = Shared Data
Bit 10 = JBIG2 Profile M
0x8781	SharedData	no	-	 
0x8782	T88Options	no	-	 
0x87ac	ImageLayer	no	-	 
0x87af	GeoTiffDirectory	int16u[0.5]	IFD0	(these "GeoTiff" tags may read and written as a block, but they aren't extracted unless specifically requested. Byte order changes are handled automatically when copying between TIFF images with different byte order)
0x87b0	GeoTiffDoubleParams	double[0.125]	IFD0	 
0x87b1	GeoTiffAsciiParams	string	IFD0	 
0x87be	JBIGOptions	no	-	 
0x8822	ExposureProgram	int16u	ExifIFD	(the value of 9 is not standard EXIF, but is used by the Canon EOS 7D)
0 = Not Defined
1 = Manual
2 = Program AE
3 = Aperture-priority AE
4 = Shutter speed priority AE
5 = Creative (Slow speed)
6 = Action (High speed)
7 = Portrait
8 = Landscape
9 = Bulb
0x8824	SpectralSensitivity	string	ExifIFD	 
0x8825	GPSInfo	-	IFD0	--> GPS Tags
0x8827	ISO	int16u[n]	ExifIFD	(called ISOSpeedRatings by EXIF 2.2, then PhotographicSensitivity by the EXIF 2.3 spec.)
0x8828	Opto-ElectricConvFactor	no	-	(called OECF by the EXIF spec.)
0x8829	Interlace	no	-	 
0x882a	TimeZoneOffset	int16s[n]	ExifIFD	(1 or 2 values: 1. The time zone offset of DateTimeOriginal from GMT in hours, 2. If present, the time zone offset of ModifyDate)
0x882b	SelfTimerMode	int16u	ExifIFD	 
0x8830	SensitivityType	int16u	ExifIFD	(applies to EXIF:ISO tag)
0 = Unknown
1 = Standard Output Sensitivity
2 = Recommended Exposure Index
3 = ISO Speed
4 = Standard Output Sensitivity and Recommended Exposure Index
5 = Standard Output Sensitivity and ISO Speed
6 = Recommended Exposure Index and ISO Speed
7 = Standard Output Sensitivity, Recommended Exposure Index and ISO Speed
0x8831	StandardOutputSensitivity	int32u	ExifIFD	 
0x8832	RecommendedExposureIndex	int32u	ExifIFD	 
0x8833	ISOSpeed	int32u	ExifIFD	 
0x8834	ISOSpeedLatitudeyyy	int32u	ExifIFD	 
0x8835	ISOSpeedLatitudezzz	int32u	ExifIFD	 
0x885c	FaxRecvParams	no	-	 
0x885d	FaxSubAddress	no	-	 
0x885e	FaxRecvTime	no	-	 
0x8871	FedexEDR	no	-	 
0x888a	LeafSubIFD	-	-	--> Leaf SubIFD Tags
0x9000	ExifVersion	undef:	ExifIFD	 
0x9003	DateTimeOriginal	string	ExifIFD	(date/time when original image was taken)
0x9004	CreateDate	string	ExifIFD	(called DateTimeDigitized by the EXIF spec.)
0x9009	GooglePlusUploadCode	undef[n]	ExifIFD	 
0x9010	OffsetTime	string	ExifIFD	(time zone for ModifyDate)
0x9011	OffsetTimeOriginal	string	ExifIFD	(time zone for DateTimeOriginal)
0x9012	OffsetTimeDigitized	string	ExifIFD	(time zone for CreateDate)
0x9101	ComponentsConfiguration	undef[4]!:	ExifIFD	
0 = -
1 = Y
2 = Cb
3 = Cr	  	4 = R
5 = G
6 = B
0x9102	CompressedBitsPerPixel	rational64u!	ExifIFD	 
0x9201	ShutterSpeedValue	rational64s	ExifIFD	(displayed in seconds, but stored as an APEX value)
0x9202	ApertureValue	rational64u	ExifIFD	(displayed as an F number, but stored as an APEX value)
0x9203	BrightnessValue	rational64s	ExifIFD	 
0x9204	ExposureCompensation	rational64s	ExifIFD	(called ExposureBiasValue by the EXIF spec.)
0x9205	MaxApertureValue	rational64u	ExifIFD	(displayed as an F number, but stored as an APEX value)
0x9206	SubjectDistance	rational64u	ExifIFD	 
0x9207	MeteringMode	int16u	ExifIFD	
0 = Unknown
1 = Average
2 = Center-weighted average
3 = Spot
4 = Multi-spot
5 = Multi-segment
6 = Partial
255 = Other
0x9208	LightSource	int16u	ExifIFD	--> EXIF LightSource Values
0x9209	Flash	int16u	ExifIFD	--> EXIF Flash Values
0x920a	FocalLength	rational64u	ExifIFD	 
0x920b	FlashEnergy	no	-	 
0x920c	SpatialFrequencyResponse	no	-	 
0x920d	Noise	no	-	 
0x920e	FocalPlaneXResolution	no	-	 
0x920f	FocalPlaneYResolution	no	-	 
0x9210	FocalPlaneResolutionUnit	no	-	1 = None
2 = inches
3 = cm
4 = mm
5 = um
0x9211	ImageNumber	int32u	ExifIFD	 
0x9212	SecurityClassification	string	ExifIFD	'C' = Confidential
'R' = Restricted
'S' = Secret
'T' = Top Secret
'U' = Unclassified
0x9213	ImageHistory	string	ExifIFD	 
0x9214	SubjectArea	int16u[n]	ExifIFD	 
0x9215	ExposureIndex	no	-	 
0x9216	TIFF-EPStandardID	no	-	 
0x9217	SensingMethod	no	-	
1 = Monochrome area
2 = One-chip color area
3 = Two-chip color area
4 = Three-chip color area
5 = Color sequential area
6 = Monochrome linear
7 = Trilinear
8 = Color sequential linear
0x923a	CIP3DataFile	no	-	 
0x923b	CIP3Sheet	no	-	 
0x923c	CIP3Side	no	-	 
0x923f	StoNits	no	-	 
0x927c	MakerNoteApple
MakerNoteNikon
MakerNoteCanon
MakerNoteCasio
MakerNoteCasio2
MakerNoteDJIInfo
MakerNoteDJI
MakerNoteFLIR
MakerNoteFujiFilm
MakerNoteGE
MakerNoteGE2
MakerNoteHasselblad
MakerNoteHP
MakerNoteHP2
MakerNoteHP4
MakerNoteHP6
MakerNoteISL
MakerNoteJVC
MakerNoteJVCText
MakerNoteKodak1a
MakerNoteKodak1b
MakerNoteKodak2
MakerNoteKodak3
MakerNoteKodak4
MakerNoteKodak5
MakerNoteKodak6a
MakerNoteKodak6b
MakerNoteKodak7
MakerNoteKodak8a
MakerNoteKodak8b
MakerNoteKodak8c
MakerNoteKodak9
MakerNoteKodak10
MakerNoteKodak11
MakerNoteKodak12
MakerNoteKodakUnknown
MakerNoteKyocera
MakerNoteMinolta
MakerNoteMinolta2
MakerNoteMinolta3
MakerNoteMotorola
MakerNoteNikon2
MakerNoteNikon3
MakerNoteNintendo
MakerNoteOlympus
MakerNoteOlympus2
MakerNoteOlympus3
MakerNoteLeica
MakerNoteLeica2
MakerNoteLeica3
MakerNoteLeica4
MakerNoteLeica5
MakerNoteLeica6
MakerNoteLeica7
MakerNoteLeica8
MakerNoteLeica9
MakerNoteLeica10
MakerNotePanasonic
MakerNotePanasonic2
MakerNotePanasonic3
MakerNotePentax
MakerNotePentax2
MakerNotePentax3
MakerNotePentax4
MakerNotePentax5
MakerNotePentax6
MakerNotePhaseOne
MakerNoteReconyx
MakerNoteReconyx2
MakerNoteReconyx3
MakerNoteRicohPentax
MakerNoteRicoh
MakerNoteRicoh2
MakerNoteRicohText
MakerNoteSamsung1a
MakerNoteSamsung1b
MakerNoteSamsung2
MakerNoteSanyo
MakerNoteSanyoC4
MakerNoteSanyoPatch
MakerNoteSigma
MakerNoteSony
MakerNoteSony2
MakerNoteSony3
MakerNoteSony4
MakerNoteSony5
MakerNoteSonyEricsson
MakerNoteSonySRF
MakerNoteUnknownText
MakerNoteUnknownBinary
MakerNoteUnknown	undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef
undef	ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD
ExifIFD	--> Apple Tags
--> Nikon Tags
--> Canon Tags
--> Casio Tags
--> Casio Type2 Tags
--> DJI Info Tags
--> DJI Tags
--> FLIR Tags
--> FujiFilm Tags
--> GE Tags
--> FujiFilm Tags
--> Unknown Tags
--> HP Tags
--> HP Type2 Tags
--> HP Type4 Tags
--> HP Type6 Tags
--> Unknown Tags
--> JVC Tags
--> JVC Text Tags
--> Kodak Tags
--> Kodak Tags
--> Kodak Type2 Tags
--> Kodak Type3 Tags
--> Kodak Type4 Tags
--> Kodak Type5 Tags
--> Kodak Type6 Tags
--> Kodak Type6 Tags
--> Kodak Type7 Tags
--> Kodak Type8 Tags
--> Kodak Type8 Tags
--> Kodak Type8 Tags
--> Kodak Type9 Tags
--> Kodak Type10 Tags
--> Kodak Type11 Tags
--> Kodak Type11 Tags
--> Kodak Unknown Tags
--> Unknown Tags
--> Minolta Tags
--> Olympus Tags
(not EXIF-based)
--> Motorola Tags
--> Nikon Type2 Tags
--> Nikon Tags
--> Nintendo Tags
--> Olympus Tags
--> Olympus Tags
--> Olympus Tags
--> Panasonic Tags
--> Panasonic Leica2 Tags
--> Panasonic Leica3 Tags
--> Panasonic Leica4 Tags
--> Panasonic Leica5 Tags
--> Panasonic Leica6 Tags
--> Panasonic Leica6 Tags
--> Panasonic Leica5 Tags
--> Panasonic Leica9 Tags
--> Panasonic Tags
--> Panasonic Tags
--> Panasonic Type2 Tags
--> Panasonic Tags
--> Pentax Tags
--> Pentax Type2 Tags
--> Casio Type2 Tags
--> Pentax Type4 Tags
--> Pentax Tags
--> Pentax S1 Tags
--> PhaseOne Tags
--> Reconyx Tags
--> Reconyx Type2 Tags
--> Reconyx Type3 Tags
--> Pentax Tags
--> Ricoh Tags
--> Ricoh Type2 Tags
--> Ricoh Text Tags
(Samsung "STMN" maker notes without PreviewImage)
--> Samsung Tags
--> Samsung Type2 Tags
--> Sanyo Tags
--> Sanyo Tags
--> Sanyo Tags
--> Sigma Tags
--> Sony Tags
--> Olympus Tags
--> Olympus Tags
--> Sony PIC Tags
--> Sony Tags
--> Sony Ericsson Tags
--> Sony SRF Tags
(unknown text-based maker notes)
(unknown binary maker notes)
--> Unknown Tags
0x9286	UserComment	undef	ExifIFD	 
0x9290	SubSecTime	string	ExifIFD	(fractional seconds for ModifyDate)
0x9291	SubSecTimeOriginal	string	ExifIFD	(fractional seconds for DateTimeOriginal)
0x9292	SubSecTimeDigitized	string	ExifIFD	(fractional seconds for CreateDate)
0x932f	MSDocumentText	no	-	 
0x9330	MSPropertySetStorage	no	-	 
0x9331	MSDocumentTextPosition	no	-	 
0x935c	ImageSourceData	undef!	IFD0	--> Photoshop DocumentData Tags
0x9400	AmbientTemperature	rational64s	ExifIFD	(ambient temperature in degrees C, called Temperature by the EXIF spec.)
0x9401	Humidity	rational64u	ExifIFD	(ambient relative humidity in percent)
0x9402	Pressure	rational64u	ExifIFD	(air pressure in hPa or mbar)
0x9403	WaterDepth	rational64s	ExifIFD	(depth under water in metres, negative for above water)
0x9404	Acceleration	rational64u	ExifIFD	(directionless camera acceleration in units of mGal, or 10-5 m/s2)
0x9405	CameraElevationAngle	rational64s	ExifIFD	 
0x9999	XiaomiSettings	string!	ExifIFD	--> JSON Tags
0x9a00	XiaomiModel	string!	ExifIFD	 
0x9c9b	XPTitle	int8u	IFD0	(tags 0x9c9b-0x9c9f are used by Windows Explorer; special characters in these values are converted to UTF-8 by default, or Windows Latin1 with the -L option. XPTitle is ignored by Windows Explorer if ImageDescription exists)
0x9c9c	XPComment	int8u	IFD0	 
0x9c9d	XPAuthor	int8u	IFD0	(ignored by Windows Explorer if Artist exists)
0x9c9e	XPKeywords	int8u	IFD0	 
0x9c9f	XPSubject	int8u	IFD0	 
0xa000	FlashpixVersion	undef:	ExifIFD	 
0xa001	ColorSpace	int16u:	ExifIFD	(the value of 0x2 is not standard EXIF. Instead, an Adobe RGB image is indicated by "Uncalibrated" with an InteropIndex of "R03". The values 0xfffd and 0xfffe are also non-standard, and are used by some Sony cameras)
0x1 = sRGB
0x2 = Adobe RGB
0xfffd = Wide Gamut RGB
0xfffe = ICC Profile
0xffff = Uncalibrated
0xa002	ExifImageWidth	int16u:	ExifIFD	(called PixelXDimension by the EXIF spec.)
0xa003	ExifImageHeight	int16u:	ExifIFD	(called PixelYDimension by the EXIF spec.)
0xa004	RelatedSoundFile	string	ExifIFD	 
0xa005	InteropOffset	-	-	--> EXIF Tags
0xa010	SamsungRawPointersOffset	no	-	 
0xa011	SamsungRawPointersLength	no	-	 
0xa101	SamsungRawByteOrder	no	-	 
0xa102	SamsungRawUnknown?	no	-	 
0xa20b	FlashEnergy	rational64u	ExifIFD	 
0xa20c	SpatialFrequencyResponse	no	-	 
0xa20d	Noise	no	-	 
0xa20e	FocalPlaneXResolution	rational64u	ExifIFD	 
0xa20f	FocalPlaneYResolution	rational64u	ExifIFD	 
0xa210	FocalPlaneResolutionUnit	int16u	ExifIFD	(values 1, 4 and 5 are not standard EXIF)
1 = None
2 = inches
3 = cm
4 = mm
5 = um
0xa211	ImageNumber	no	-	 
0xa212	SecurityClassification	no	-	 
0xa213	ImageHistory	no	-	 
0xa214	SubjectLocation	int16u[2]	ExifIFD	 
0xa215	ExposureIndex	rational64u	ExifIFD	 
0xa216	TIFF-EPStandardID	no	-	 
0xa217	SensingMethod	int16u	ExifIFD	
1 = Not defined
2 = One-chip color area
3 = Two-chip color area
4 = Three-chip color area
5 = Color sequential area
7 = Trilinear
8 = Color sequential linear
0xa300	FileSource	undef	ExifIFD	1 = Film Scanner
2 = Reflection Print Scanner
3 = Digital Camera
"\x03\x00\x00\x00" = Sigma Digital Camera
0xa301	SceneType	undef	ExifIFD	1 = Directly photographed
0xa302	CFAPattern	undef	ExifIFD	 
0xa401	CustomRendered	int16u	ExifIFD	(only 0 and 1 are standard EXIF, but other values are used by Apple iOS devices)
0 = Normal
1 = Custom
2 = HDR (no original saved)
3 = HDR (original saved)
4 = Original (for HDR)
6 = Panorama
7 = Portrait HDR
8 = Portrait
0xa402	ExposureMode	int16u	ExifIFD	0 = Auto
1 = Manual
2 = Auto bracket
0xa403	WhiteBalance	int16u	ExifIFD	0 = Auto
1 = Manual
0xa404	DigitalZoomRatio	rational64u	ExifIFD	 
0xa405	FocalLengthIn35mmFormat	int16u	ExifIFD	(called FocalLengthIn35mmFilm by the EXIF spec.)
0xa406	SceneCaptureType	int16u	ExifIFD	(the value of 4 is non-standard, and used by some Samsung models)
0 = Standard
1 = Landscape
2 = Portrait
3 = Night
4 = Other
0xa407	GainControl	int16u	ExifIFD	0 = None
1 = Low gain up
2 = High gain up
3 = Low gain down
4 = High gain down
0xa408	Contrast	int16u	ExifIFD	0 = Normal
1 = Low
2 = High
0xa409	Saturation	int16u	ExifIFD	0 = Normal
1 = Low
2 = High
0xa40a	Sharpness	int16u	ExifIFD	0 = Normal
1 = Soft
2 = Hard
0xa40b	DeviceSettingDescription	no	-	 
0xa40c	SubjectDistanceRange	int16u	ExifIFD	0 = Unknown
1 = Macro
2 = Close
3 = Distant
0xa420	ImageUniqueID	string	ExifIFD	 
0xa430	OwnerName	string	ExifIFD	(called CameraOwnerName by the EXIF spec.)
0xa431	SerialNumber	string	ExifIFD	(called BodySerialNumber by the EXIF spec.)
0xa432	LensInfo	rational64u[4]	ExifIFD	(4 rational values giving focal and aperture ranges, called LensSpecification by the EXIF spec.)
0xa433	LensMake	string	ExifIFD	 
0xa434	LensModel	string	ExifIFD	 
0xa435	LensSerialNumber	string	ExifIFD	 
0xa436	ImageTitle	string	ExifIFD	 
0xa437	Photographer	string	ExifIFD	 
0xa438	ImageEditor	string	ExifIFD	 
0xa439	CameraFirmware	string	ExifIFD	 
0xa43a	RAWDevelopingSoftware	string	ExifIFD	 
0xa43b	ImageEditingSoftware	string	ExifIFD	 
0xa43c	MetadataEditingSoftware	string	ExifIFD	 
0xa460	CompositeImage	int16u	ExifIFD	0 = Unknown
1 = Not a Composite Image
2 = General Composite Image
3 = Composite Image Captured While Shooting
0xa461	CompositeImageCount	int16u[2]	ExifIFD	(2 values: 1. Number of source images, 2. Number of images used. Called SourceImageNumberOfCompositeImage by the EXIF spec.)
0xa462	CompositeImageExposureTimes	undef	ExifIFD	(11 or more values: 1. Total exposure time period, 2. Total exposure of all source images, 3. Total exposure of all used images, 4. Max exposure time of source images, 5. Max exposure time of used images, 6. Min exposure time of source images, 7. Min exposure of used images, 8. Number of sequences, 9. Number of source images in sequence. 10-N. Exposure times of each source image. Called SourceExposureTimesOfCompositeImage by the EXIF spec.)
0xa480	GDALMetadata	string	IFD0	 
0xa481	GDALNoData	string	IFD0	 
0xa500	Gamma	rational64u	ExifIFD	 
0xafc0	ExpandSoftware	no	-	 
0xafc1	ExpandLens	no	-	 
0xafc2	ExpandFilm	no	-	 
0xafc3	ExpandFilterLens	no	-	 
0xafc4	ExpandScanner	no	-	 
0xafc5	ExpandFlashLamp	no	-	 
0xb4c3	HasselbladRawImage	no	-	 
0xbc01	PixelFormat	no	-	(tags 0xbc** are used in Windows HD Photo (HDP and WDP) images. The actual PixelFormat values are 16-byte GUID's but the leading 15 bytes, '6fddc324-4e03-4bfe-b1853-d77768dc9', have been removed below to avoid unnecessary clutter)
0x5 = Black & White
0x8 = 8-bit Gray
0x9 = 16-bit BGR555
0xa = 16-bit BGR565
0xb = 16-bit Gray
0xc = 24-bit BGR
0xd = 24-bit RGB
0xe = 32-bit BGR
0xf = 32-bit BGRA
0x10 = 32-bit PBGRA
0x11 = 32-bit Gray Float
0x12 = 48-bit RGB Fixed Point
0x13 = 32-bit BGR101010
0x15 = 48-bit RGB
0x16 = 64-bit RGBA
0x17 = 64-bit PRGBA
0x18 = 96-bit RGB Fixed Point
0x19 = 128-bit RGBA Float
0x1a = 128-bit PRGBA Float
0x1b = 128-bit RGB Float
0x1c = 32-bit CMYK
0x1d = 64-bit RGBA Fixed Point
0x1e = 128-bit RGBA Fixed Point
0x1f = 64-bit CMYK
0x20 = 24-bit 3 Channels
0x21 = 32-bit 4 Channels
0x22 = 40-bit 5 Channels
0x23 = 48-bit 6 Channels
0x24 = 56-bit 7 Channels
0x25 = 64-bit 8 Channels
0x26 = 48-bit 3 Channels
0x27 = 64-bit 4 Channels
0x28 = 80-bit 5 Channels
0x29 = 96-bit 6 Channels
0x2a = 112-bit 7 Channels
0x2b = 128-bit 8 Channels
0x2c = 40-bit CMYK Alpha
0x2d = 80-bit CMYK Alpha
0x2e = 32-bit 3 Channels Alpha
0x2f = 40-bit 4 Channels Alpha
0x30 = 48-bit 5 Channels Alpha
0x31 = 56-bit 6 Channels Alpha
0x32 = 64-bit 7 Channels Alpha
0x33 = 72-bit 8 Channels Alpha
0x34 = 64-bit 3 Channels Alpha
0x35 = 80-bit 4 Channels Alpha
0x36 = 96-bit 5 Channels Alpha
0x37 = 112-bit 6 Channels Alpha
0x38 = 128-bit 7 Channels Alpha
0x39 = 144-bit 8 Channels Alpha
0x3a = 64-bit RGBA Half
0x3b = 48-bit RGB Half
0x3d = 32-bit RGBE
0x3e = 16-bit Gray Half
0x3f = 32-bit Gray Fixed Point
0xbc02	Transformation	no	-	
0 = Horizontal (normal)
1 = Mirror vertical
2 = Mirror horizontal
3 = Rotate 180
4 = Rotate 90 CW
5 = Mirror horizontal and rotate 90 CW
6 = Mirror horizontal and rotate 270 CW
7 = Rotate 270 CW
0xbc03	Uncompressed	no	-	0 = No
1 = Yes
0xbc04	ImageType	no	-	Bit 0 = Preview
Bit 1 = Page
0xbc80	ImageWidth	no	-	 
0xbc81	ImageHeight	no	-	 
0xbc82	WidthResolution	no	-	 
0xbc83	HeightResolution	no	-	 
0xbcc0	ImageOffset	no	-	 
0xbcc1	ImageByteCount	no	-	 
0xbcc2	AlphaOffset	no	-	 
0xbcc3	AlphaByteCount	no	-	 
0xbcc4	ImageDataDiscard	no	-	0 = Full Resolution
1 = Flexbits Discarded
2 = HighPass Frequency Data Discarded
3 = Highpass and LowPass Frequency Data Discarded
0xbcc5	AlphaDataDiscard	no	-	0 = Full Resolution
1 = Flexbits Discarded
2 = HighPass Frequency Data Discarded
3 = Highpass and LowPass Frequency Data Discarded
0xc427	OceScanjobDesc	no	-	 
0xc428	OceApplicationSelector	no	-	 
0xc429	OceIDNumber	no	-	 
0xc42a	OceImageLogic	no	-	 
0xc44f	Annotations	no	-	 
0xc4a5	PrintIM	undef	IFD0	--> PrintIM Tags
0xc519	HasselbladXML	-	-	--> PLIST Tags
0xc51b	HasselbladExif	-	-	--> EXIF Tags
0xc573	OriginalFileName	no	-	(used by some obscure software)
0xc580	USPTOOriginalContentType	no	-	0 = Text or Drawing
1 = Grayscale
2 = Color
0xc5e0	CR2CFAPattern	no	-	1 => '0 1 1 2' = [Red,Green][Green,Blue]
4 => '1 0 2 1' = [Green,Red][Blue,Green]
3 => '1 2 0 1' = [Green,Blue][Red,Green]
2 => '2 1 1 0' = [Blue,Green][Green,Red]
0xc612	DNGVersion	int8u[4]!	IFD0	(tags 0xc612-0xcd48 are defined by the DNG specification unless otherwise noted. See https://helpx.adobe.com/photoshop/digital-negative.html for the specification)
0xc613	DNGBackwardVersion	int8u[4]!	IFD0	 
0xc614	UniqueCameraModel	string	IFD0	 
0xc615	LocalizedCameraModel	string	IFD0	 
0xc616	CFAPlaneColor	no	SubIFD	 
0xc617	CFALayout	no	SubIFD	1 = Rectangular
2 = Even columns offset down 1/2 row
3 = Even columns offset up 1/2 row
4 = Even rows offset right 1/2 column
5 = Even rows offset left 1/2 column
6 = Even rows offset up by 1/2 row, even columns offset left by 1/2 column
7 = Even rows offset up by 1/2 row, even columns offset right by 1/2 column
8 = Even rows offset down by 1/2 row, even columns offset left by 1/2 column
9 = Even rows offset down by 1/2 row, even columns offset right by 1/2 column
0xc618	LinearizationTable	int16u[n]!	SubIFD	 
0xc619	BlackLevelRepeatDim	int16u[2]!	SubIFD	 
0xc61a	BlackLevel	rational64u[n]!	SubIFD	 
0xc61b	BlackLevelDeltaH	rational64s[n]!	SubIFD	 
0xc61c	BlackLevelDeltaV	rational64s[n]!	SubIFD	 
0xc61d	WhiteLevel	int32u[n]!	SubIFD	 
0xc61e	DefaultScale	rational64u[2]!	SubIFD	 
0xc61f	DefaultCropOrigin	int32u[2]!	SubIFD	 
0xc620	DefaultCropSize	int32u[2]!	SubIFD	 
0xc621	ColorMatrix1	rational64s[n]!	IFD0	 
0xc622	ColorMatrix2	rational64s[n]!	IFD0	 
0xc623	CameraCalibration1	rational64s[n]!	IFD0	 
0xc624	CameraCalibration2	rational64s[n]!	IFD0	 
0xc625	ReductionMatrix1	rational64s[n]!	IFD0	 
0xc626	ReductionMatrix2	rational64s[n]!	IFD0	 
0xc627	AnalogBalance	rational64u[n]!	IFD0	 
0xc628	AsShotNeutral	rational64u[n]!	IFD0	 
0xc629	AsShotWhiteXY	rational64u[2]!	IFD0	 
0xc62a	BaselineExposure	rational64s!	IFD0	 
0xc62b	BaselineNoise	rational64u!	IFD0	 
0xc62c	BaselineSharpness	rational64u!	IFD0	 
0xc62d	BayerGreenSplit	int32u!	SubIFD	 
0xc62e	LinearResponseLimit	rational64u!	IFD0	 
0xc62f	CameraSerialNumber	string	IFD0	 
0xc630	DNGLensInfo	rational64u[4]	IFD0	 
0xc631	ChromaBlurRadius	rational64u!	SubIFD	 
0xc632	AntiAliasStrength	rational64u!	SubIFD	 
0xc633	ShadowScale	rational64u!	IFD0	 
0xc634	SR2Private
DNGAdobeData
MakerNotePentax
MakerNotePentax5
MakerNoteRicohPentax
MakerNoteDJIInfo
DNGPrivateData	-
undef!
-
-
-
-
int8u!	IFD0
IFD0
IFD0
IFD0
IFD0
IFD0
IFD0	--> Sony SR2Private Tags
--> DNG AdobeData Tags
--> Pentax Tags
--> Pentax Tags
--> Pentax Tags
--> DJI Info Tags
0xc635	MakerNoteSafety	int16u	IFD0	0 = Unsafe
1 = Safe
0xc640	RawImageSegmentation	no	-	(used in segmented Canon CR2 images. 3 numbers: 1. Number of segments minus one; 2. Pixel width of segments except last; 3. Pixel width of last segment)
0xc65a	CalibrationIlluminant1	int16u!	IFD0	--> EXIF LightSource Values
0xc65b	CalibrationIlluminant2	int16u!	IFD0	--> EXIF LightSource Values
0xc65c	BestQualityScale	rational64u!	SubIFD	 
0xc65d	RawDataUniqueID	int8u[16]!	IFD0	 
0xc660	AliasLayerMetadata	no	-	(used by Alias Sketchbook Pro)
0xc68b	OriginalRawFileName	string!	IFD0	 
0xc68c	OriginalRawFileData	undef!	IFD0	--> DNG OriginalRaw Tags
0xc68d	ActiveArea	int32u[4]!	SubIFD	 
0xc68e	MaskedAreas	int32u[n]!	SubIFD	 
0xc68f	AsShotICCProfile	undef!	IFD0	--> ICC_Profile Tags
0xc690	AsShotPreProfileMatrix	rational64s[n]!	IFD0	 
0xc691	CurrentICCProfile	undef!	IFD0	--> ICC_Profile Tags
0xc692	CurrentPreProfileMatrix	rational64s[n]!	IFD0	 
0xc6bf	ColorimetricReference	int16u!	IFD0	0 = Scene-referred
1 = Output-referred (ICC Profile Dynamic Range)
2 = Output-referred (High Dyanmic Range)
0xc6c5	SRawType	no	IFD0	 
0xc6d2	PanasonicTitle	undef	IFD0	(proprietary Panasonic tag used for baby/pet name, etc)
0xc6d3	PanasonicTitle2	undef	IFD0	(proprietary Panasonic tag used for baby/pet name with age)
0xc6f3	CameraCalibrationSig	string!	IFD0	 
0xc6f4	ProfileCalibrationSig	string!	IFD0	 
0xc6f5	ProfileIFD	-	IFD0	--> EXIF Tags
0xc6f6	AsShotProfileName	string!	IFD0	 
0xc6f7	NoiseReductionApplied	rational64u!	SubIFD	 
0xc6f8	ProfileName	string!	IFD0	 
0xc6f9	ProfileHueSatMapDims	int32u[3]!	IFD0	 
0xc6fa	ProfileHueSatMapData1	float[n]!	IFD0	 
0xc6fb	ProfileHueSatMapData2	float[n]!	IFD0	 
0xc6fc	ProfileToneCurve	float[n]!	IFD0	 
0xc6fd	ProfileEmbedPolicy	int32u!	IFD0	0 = Allow Copying
1 = Embed if Used
2 = Never Embed
3 = No Restrictions
0xc6fe	ProfileCopyright	string!	IFD0	 
0xc714	ForwardMatrix1	rational64s[n]!	IFD0	 
0xc715	ForwardMatrix2	rational64s[n]!	IFD0	 
0xc716	PreviewApplicationName	string!	IFD0	 
0xc717	PreviewApplicationVersion	string!	IFD0	 
0xc718	PreviewSettingsName	string!	IFD0	 
0xc719	PreviewSettingsDigest	int8u!	IFD0	 
0xc71a	PreviewColorSpace	int32u!	IFD0	0 = Unknown
1 = Gray Gamma 2.2
2 = sRGB
3 = Adobe RGB
4 = ProPhoto RGB
0xc71b	PreviewDateTime	string!	IFD0	 
0xc71c	RawImageDigest	int8u[16]!	IFD0	 
0xc71d	OriginalRawFileDigest	int8u[16]!	IFD0	 
0xc71e	SubTileBlockSize	no	-	 
0xc71f	RowInterleaveFactor	no	-	 
0xc725	ProfileLookTableDims	int32u[3]!	IFD0	 
0xc726	ProfileLookTableData	float[n]!	IFD0	 
0xc740	OpcodeList1	undef~!	SubIFD	
1 = WarpRectilinear
2 = WarpFisheye
3 = FixVignetteRadial
4 = FixBadPixelsConstant
5 = FixBadPixelsList
6 = TrimBounds
7 = MapTable	  	8 = MapPolynomial
9 = GainMap
10 = DeltaPerRow
11 = DeltaPerColumn
12 = ScalePerRow
13 = ScalePerColumn
14 = WarpRectilinear2
0xc741	OpcodeList2	undef~!	SubIFD	
1 = WarpRectilinear
2 = WarpFisheye
3 = FixVignetteRadial
4 = FixBadPixelsConstant
5 = FixBadPixelsList
6 = TrimBounds
7 = MapTable	  	8 = MapPolynomial
9 = GainMap
10 = DeltaPerRow
11 = DeltaPerColumn
12 = ScalePerRow
13 = ScalePerColumn
14 = WarpRectilinear2
0xc74e	OpcodeList3	undef~!	SubIFD	
1 = WarpRectilinear
2 = WarpFisheye
3 = FixVignetteRadial
4 = FixBadPixelsConstant
5 = FixBadPixelsList
6 = TrimBounds
7 = MapTable	  	8 = MapPolynomial
9 = GainMap
10 = DeltaPerRow
11 = DeltaPerColumn
12 = ScalePerRow
13 = ScalePerColumn
14 = WarpRectilinear2
0xc761	NoiseProfile	double[n]!	SubIFD	 
0xc763	TimeCodes	int8u[n]	IFD0	 
0xc764	FrameRate	rational64s	IFD0	 
0xc772	TStop	rational64u[n]	IFD0	 
0xc789	ReelName	string	IFD0	 
0xc791	OriginalDefaultFinalSize	int32u[2]!	IFD0	 
0xc792	OriginalBestQualitySize	int32u[2]!	IFD0	(called OriginalBestQualityFinalSize by the DNG spec)
0xc793	OriginalDefaultCropSize	rational64u[2]!	IFD0	 
0xc7a1	CameraLabel	string	IFD0	 
0xc7a3	ProfileHueSatMapEncoding	int32u!	IFD0	0 = Linear
1 = sRGB
0xc7a4	ProfileLookTableEncoding	int32u!	IFD0	0 = Linear
1 = sRGB
0xc7a5	BaselineExposureOffset	rational64s!	IFD0	 
0xc7a6	DefaultBlackRender	int32u!	IFD0	0 = Auto
1 = None
0xc7a7	NewRawImageDigest	int8u[16]!	IFD0	 
0xc7a8	RawToPreviewGain	double!	IFD0	 
0xc7aa	CacheVersion	int32u!	SubIFD2	 
0xc7b5	DefaultUserCrop	rational64u[4]!	SubIFD	 
0xc7d5	NikonNEFInfo	-	-	--> Nikon NEFInfo Tags
0xc7e9	DepthFormat	int16u!	IFD0	(tags 0xc7e9-0xc7ee added by DNG 1.5.0.0)
0 = Unknown
1 = Linear
2 = Inverse
0xc7ea	DepthNear	rational64u!	IFD0	 
0xc7eb	DepthFar	rational64u!	IFD0	 
0xc7ec	DepthUnits	int16u!	IFD0	0 = Unknown
1 = Meters
0xc7ed	DepthMeasureType	int16u!	IFD0	0 = Unknown
1 = Optical Axis
2 = Optical Ray
0xc7ee	EnhanceParams	string!	IFD0	 
0xcd2d	ProfileGainTableMap	undef!	SubIFD	 
0xcd2e	SemanticName	no	SubIFD	 
0xcd30	SemanticInstanceID	no	SubIFD	 
0xcd31	CalibrationIlluminant3	int16u!	IFD0	--> EXIF LightSource Values
0xcd32	CameraCalibration3	rational64s[n]!	IFD0	 
0xcd33	ColorMatrix3	rational64s[n]!	IFD0	 
0xcd34	ForwardMatrix3	rational64s[n]!	IFD0	 
0xcd35	IlluminantData1	undef!	IFD0	 
0xcd36	IlluminantData2	undef!	IFD0	 
0xcd37	IlluminantData3	undef!	IFD0	 
0xcd38	MaskSubArea	no	SubIFD	 
0xcd39	ProfileHueSatMapData3	float[n]!	IFD0	 
0xcd3a	ReductionMatrix3	rational64s[n]!	IFD0	 
0xcd3f	RGBTables	undef!	IFD0	 
0xcd40	ProfileGainTableMap2	undef!	IFD0	 
0xcd41	JUMBF	-	-	--> Jpeg2000 Tags
0xcd43	ColumnInterleaveFactor	int32u!	SubIFD	 
0xcd44	ImageSequenceInfo	undef	IFD0	--> DNG ImageSeq Tags
0xcd46	ImageStats	undef!	IFD0	 
0xcd47	ProfileDynamicRange	undef	IFD0	--> DNG ProfileDynamicRange Tags
0xcd48	ProfileGroupName	string!	IFD0	 
0xcd49	JXLDistance	float	IFD0	 
0xcd4a	JXLEffort	int32u	IFD0	(values range from 1=low to 9=high)
0xcd4b	JXLDecodeSpeed	int32u	IFD0	(values range from 1=slow to 4=fast)
0xcea1	SEAL	string	IFD0	--> XMP SEAL Tags
0xea1c	Padding	undef!	ExifIFD	 
0xea1d	OffsetSchema	int32s!	ExifIFD	(Microsoft's ill-conceived maker note offset difference)
0xfde8	OwnerName	string/	ExifIFD	(tags 0xfde8-0xfdea and 0xfe4c-0xfe58 are generated by Photoshop Camera RAW. Some names are the same as other EXIF tags, but ExifTool will avoid writing these unless they already exist in the file)
0xfde9	SerialNumber	string/	ExifIFD	 
0xfdea	Lens	string/	ExifIFD	 
0xfe00	KDC_IFD	-	-	--> Kodak KDC_IFD Tags
(used in some Kodak KDC images)
0xfe4c	RawFile	string/	ExifIFD	 
0xfe4d	Converter	string/	ExifIFD	 
0xfe4e	WhiteBalance	string/	ExifIFD	 
0xfe51	Exposure	string/	ExifIFD	 
0xfe52	Shadows	string/	ExifIFD	 
0xfe53	Brightness	string/	ExifIFD	 
0xfe54	Contrast	string/	ExifIFD	 
0xfe55	Saturation	string/	ExifIFD	 
0xfe56	Sharpness	string/	ExifIFD	 
0xfe57	Smoothness	string/	ExifIFD	 
0xfe58	MoireFilter	string/	ExifIFD	 
EXIF Compression Values
Value	Compression
1	= Uncompressed
2	= CCITT 1D
3	= T4/Group 3 Fax
4	= T6/Group 4 Fax
5	= LZW
6	= JPEG (old-style)
7	= JPEG
8	= Adobe Deflate
9	= JBIG B&W
10	= JBIG Color
99	= JPEG
262	= Kodak 262
32766	= Next
32767	= Sony ARW Compressed
32769	= Packed RAW
32770	= Samsung SRW Compressed
32771	= CCIRLEW
32772	= Samsung SRW Compressed 2
32773	= PackBits
32809	= Thunderscan
32867	= Kodak KDC Compressed
32895	= IT8CTPAD
32896	= IT8LW
32897	= IT8MP
32898	= IT8BL
32908	= PixarFilm
32909	= PixarLog
32946	= Deflate
32947	= DCS
33003	= Aperio JPEG 2000 YCbCr
33005	= Aperio JPEG 2000 RGB
34661	= JBIG
34676	= SGILog
34677	= SGILog24
34712	= JPEG 2000
34713	= Nikon NEF Compressed
34715	= JBIG2 TIFF FX
34718	= Microsoft Document Imaging (MDI) Binary Level Codec
34719	= Microsoft Document Imaging (MDI) Progressive Transform Codec
34720	= Microsoft Document Imaging (MDI) Vector
34887	= ESRI Lerc
34892	= Lossy JPEG
34925	= LZMA2
34926	= Zstd
34927	= WebP
34933	= PNG
34934	= JPEG XR
52546	= JPEG XL
65000	= Kodak DCR Compressed
65535	= Pentax PEF Compressed
EXIF LightSource Values
Value	LightSource	Value	LightSource	Value	LightSource
0	= Unknown	12	= Daylight Fluorescent	20	= D55
1	= Daylight	13	= Day White Fluorescent	21	= D65
2	= Fluorescent	14	= Cool White Fluorescent	22	= D75
3	= Tungsten (Incandescent)	15	= White Fluorescent	23	= D50
4	= Flash	16	= Warm White Fluorescent	24	= ISO Studio Tungsten
9	= Fine Weather	17	= Standard Light A	255	= Other
10	= Cloudy	18	= Standard Light B	 	 
11	= Shade	19	= Standard Light C	 	 
EXIF Flash Values
Value	Flash
0x0	= No Flash
0x1	= Fired
0x5	= Fired, Return not detected
0x7	= Fired, Return detected
0x8	= On, Did not fire
0x9	= On, Fired
0xd	= On, Return not detected
0xf	= On, Return detected
0x10	= Off, Did not fire
0x14	= Off, Did not fire, Return not detected
0x18	= Auto, Did not fire
0x19	= Auto, Fired
0x1d	= Auto, Fired, Return not detected
0x1f	= Auto, Fired, Return detected
0x20	= No flash function
0x30	= Off, No flash function
0x41	= Fired, Red-eye reduction
0x45	= Fired, Red-eye reduction, Return not detected
0x47	= Fired, Red-eye reduction, Return detected
0x49	= On, Red-eye reduction
0x4d	= On, Red-eye reduction, Return not detected
0x4f	= On, Red-eye reduction, Return detected
0x50	= Off, Red-eye reduction
0x58	= Auto, Did not fire, Red-eye reduction
0x59	= Auto, Fired, Red-eye reduction
0x5d	= Auto, Fired, Red-eye reduction, Return not detected
0x5f	= Auto, Fired, Red-eye reduction, Return detected
(This document generated automatically by Image::ExifTool::BuildTagLookup)
Last revised Nov 10, 2024
<-- ExifTool Tag Names